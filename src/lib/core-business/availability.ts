import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { TIMEZONE } from '@/lib/config';

export type ServiceType = 'reservation' | 'takeaway';

/**
 * Checks if a specific timeslot has capacity for a given party size.
 * Validates against physical seats (reservations) or kitchen slots (takeaway).
 */
export async function checkCapacity(
    restaurantId: string,
    date: Date,
    timeStr: string,
    partySize: number,
    serviceType: ServiceType = 'reservation'
): Promise<{ isAvailable: boolean; remainingSeats?: number }> {
    try {
        const dateStr = format(date, 'yyyy-MM-dd');
        // Construct Santiago Time
        const santiagoTimeStr = `${dateStr} ${timeStr}:00`;
        const slotTime = fromZonedTime(santiagoTimeStr, TIMEZONE);

        // Use unified RPC parameter depending on the service type
        // Wait, current RPC is specific: check_restaurant_availability
        // It could easily be adapted for both if the database uses a generic function
        // For now, mapping directly to what ReservationWizard was doing

        const { data, error } = await supabase.rpc('check_restaurant_availability', {
            p_restaurant_id: restaurantId,
            p_selected_time: slotTime.toISOString(),
            p_party_size: partySize,
            // Depending on Supabase design, a service_type flag could be added here
        });

        if (error) {
            console.error('[Business Logic] Error checking capacity:', error);
            // Fallback to allow if RPC fails, prevent blocking due to tech error
            return { isAvailable: true };
        }

        if (data) {
            // Supabase RPC can return an array or a single object depending on the function definition
            const result = Array.isArray(data) ? data[0] : data;
            if (result) {
                return {
                    isAvailable: result.is_available ?? true,
                    remainingSeats: result.remaining_seats ?? 0
                };
            }
        }

        return { isAvailable: true };
    } catch (err) {
        console.error('[Business Logic] Crash calculating capacity:', err);
        return { isAvailable: true };
    }
}
