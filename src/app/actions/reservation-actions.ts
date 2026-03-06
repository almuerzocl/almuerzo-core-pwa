'use server';

import { createClient } from '@/utils/supabase/server';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
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
        const slots: any[] = [];

        // Determine operating hours for the day in Santiago
        const dayOfWeek = format(fromZonedTime(`${dateStr} 12:00:00`, 'America/Santiago'), 'eeee').toLowerCase();
        const hoursConfig = restaurant.operating_hours || restaurant.opening_hours || {};
        const dayShifts = Array.isArray(hoursConfig[dayOfWeek]) 
            ? hoursConfig[dayOfWeek] 
            : (hoursConfig[dayOfWeek] && typeof hoursConfig[dayOfWeek] === 'object' ? [hoursConfig[dayOfWeek]] : []);

        if (dayShifts.length === 0) {
            // Restaurant is closed this day
            return { success: true, data: [] };
        }

        // Generate slots for each assigned shift
        dayShifts.forEach((shift: { open: string, close: string }) => {
            if (!shift.open || !shift.close) return;

            // Convert shift times to Date objects for comparison
            const startTimeZoned = fromZonedTime(`${dateStr} ${shift.open}:00`, 'America/Santiago');
            const endTimeZoned = fromZonedTime(`${dateStr} ${shift.close}:00`, 'America/Santiago');

            let currentSlotStart = startTimeZoned;

            // Increment by 30 mins for the time picker, but respect the closing time minus slot duration
            // Actually, we show booking slots. Usually, a restaurant takes bookings up to 30-60 mins before closing.
            // For now, let's keep it simple: any slot that starts before the closing time.
            while (currentSlotStart < endTimeZoned) {
                const timeStr = format(toZonedTime(currentSlotStart, 'America/Santiago'), 'HH:mm');
                const slotEnd = new Date(currentSlotStart.getTime() + slotDuration * 60000);

                // Overlap Capacity Calculation
                let occupied = 0;
                reservations.forEach((res: any) => {
                    const resStart = new Date(res.date_time);
                    const resEnd = new Date(resStart.getTime() + slotDuration * 60000);

                    if (resStart < slotEnd && resEnd > currentSlotStart) {
                        occupied += res.party_size;
                    }
                });

                // Check Blocks
                let currentBlocked = 0;
                blocks.forEach((block: any) => {
                    const blockStart = new Date(block.start_time);
                    const blockEnd = new Date(block.end_time);
                    if (blockStart < slotEnd && blockEnd > currentSlotStart) {
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

                // Next 30min slot
                currentSlotStart = new Date(currentSlotStart.getTime() + 30 * 60000);
            }
        });

        // Ensure unique slots and sort by time
        const uniqueSlots = Array.from(new Map(slots.map(s => [s.time, s])).values())
            .sort((a, b) => a.time.localeCompare(b.time));

        return { success: true, data: uniqueSlots };
    } catch (error: any) {
        console.error('Error fetching availability:', error);
        return { success: false, error: error.message };
    }
}
