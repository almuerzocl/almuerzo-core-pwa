'use server';

import { createClient } from '@/utils/supabase/server';
import { fromZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

export async function getRestaurantDailyAvailabilityAction(restaurantId: string, dateStr: string) {
    try {
        const supabase = await createClient();

        // 1. Get restaurant config
        const { data: restaurant, error: restError } = await supabase
            .from('restaurants')
            .select('slot_duration, space_capacities, operating_hours, opening_hours')
            .eq('id', restaurantId)
            .single();

        if (restError || !restaurant) throw new Error('Restaurante no encontrado');

        const slotDuration = restaurant.slot_duration || 90;
        const totalCapacity = Object.values(restaurant.space_capacities || {}).reduce((a: number, b: any) => a + Number(b), 0) || 50;

        // 2. Get reservations and blocks for that day (using Santiago boundaries)
        const startOfDay = fromZonedTime(`${dateStr} 00:00:00`, 'America/Santiago').toISOString();
        const endOfDay = fromZonedTime(`${dateStr} 23:59:59`, 'America/Santiago').toISOString();

        const [resResponse, blocksResponse] = await Promise.all([
            supabase
                .from('reservations')
                .select('date_time, party_size')
                .eq('restaurant_id', restaurantId)
                .in('status', ['CONFIRMADA', 'PENDIENTE', 'CREADA', 'CHECK-IN CLIENTE'])
                .gte('date_time', startOfDay)
                .lte('date_time', endOfDay),
            supabase
                .from('reservation_blocks')
                .select('start_time, end_time, blocked_slots')
                .eq('restaurant_id', restaurantId)
                .eq('is_active', true)
                .lte('start_time', endOfDay)
                .gte('end_time', startOfDay)
        ]);

        if (resResponse.error) throw resResponse.error;
        if (blocksResponse.error) throw blocksResponse.error;

        const reservations = resResponse.data || [];
        const blocks = blocksResponse.data || [];

        // 3. Calculate slots based on operating hours
        const slots = [];

        // Helper to determine operating hours for the day - Use midday to avoid DST/timezone shift on the date boundary
        const dayOfWeek = format(fromZonedTime(`${dateStr} 12:00:00`, 'America/Santiago'), 'eeee').toLowerCase();
        const hoursConfig = restaurant.operating_hours || restaurant.opening_hours || {};

        const dayConfig = hoursConfig[dayOfWeek];
        // Sample config: "monday": [{ "open": "08:00", "close": "21:30" }]

        let startHour = 9;
        let endHour = 22;

        if (Array.isArray(dayConfig) && dayConfig.length > 0) {
            const firstSlot = dayConfig[0];
            if (firstSlot.open) startHour = parseInt(firstSlot.open.split(':')[0]);
            if (firstSlot.close) endHour = parseInt(firstSlot.close.split(':')[0]);
        } else if (dayConfig && typeof dayConfig === 'object' && dayConfig.open) {
            startHour = parseInt(dayConfig.open.split(':')[0]);
            endHour = parseInt(dayConfig.close.split(':')[0]);
        }

        // Generate slots
        for (let h = startHour; h <= endHour; h++) {
            for (let m = 0; m < 60; m += 30) {
                if (h === endHour && m > 0) break; // Don't go past closing hour

                const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                const slotStart = fromZonedTime(`${dateStr} ${timeStr}:00`, 'America/Santiago');
                const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

                let occupied = 0;
                reservations.forEach((res: any) => {
                    const resStart = new Date(res.date_time);
                    const resEnd = new Date(resStart.getTime() + slotDuration * 60000);

                    // Overlap check
                    if (resStart < slotEnd && resEnd > slotStart) {
                        occupied += res.party_size;
                    }
                });

                // Subtract blocked slots
                let currentBlocked = 0;
                blocks.forEach((block: any) => {
                    const blockStart = new Date(block.start_time);
                    const blockEnd = new Date(block.end_time);
                    if (blockStart < slotEnd && blockEnd > slotStart) {
                        currentBlocked += block.blocked_slots;
                    }
                });

                const effectiveCapacity = Math.max(0, totalCapacity - currentBlocked);

                slots.push({
                    time: timeStr,
                    available: occupied < effectiveCapacity,
                    occupied,
                    totalCapacity: effectiveCapacity
                });
            }
        }

        return { success: true, data: slots };
    } catch (error: any) {
        console.error('Error fetching availability:', error);
        return { success: false, error: error.message };
    }
}
