import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import type { ServiceType } from './availability';

export interface Discount {
    id: string;
    name: string;
    description: string;
    discount_percentage: number;
    valid_from?: string;
    valid_until?: string;
    valid_days?: string[];
}

/**
 * Fetches the user's available discounts for a specific day and service type.
 */
export async function getAvailableDiscounts(
    restaurantId: string,
    date: Date,
    serviceType: ServiceType = 'reservation'
): Promise<Discount[]> {
    try {
        const formattedDate = format(date, 'yyyy-MM-dd');
        const { data, error } = await supabase.rpc('get_my_available_discounts', {
            p_restaurant_id: restaurantId,
            p_service_type: serviceType, // Uses the flexible service parameter
            p_date: formattedDate
        });

        if (error) {
            console.error('[Business Logic] Error fetching discounts:', error);
            return [];
        }

        if (data && Array.isArray(data)) {
            // Map label back to name for standard interface usage
            return data.map((d: any) => ({
                ...d,
                name: d.label || d.name
            }));
        }

        return [];
    } catch (err) {
        console.error('[Business Logic] Exception in getDiscounts:', err);
        return [];
    }
}
