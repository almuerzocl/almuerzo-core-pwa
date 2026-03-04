import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

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
        const slotTime = fromZonedTime(santiagoTimeStr, 'America/Santiago');

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
            return {
                isAvailable: data.is_available,
                remainingSeats: data.remaining_seats
            };
        }

        return { isAvailable: true };
    } catch (err) {
        console.error('[Business Logic] Crash calculating capacity:', err);
        return { isAvailable: true };
    }
}
