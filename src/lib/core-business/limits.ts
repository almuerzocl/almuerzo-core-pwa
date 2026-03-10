import { supabase } from '@/lib/supabase';
import { toZonedTime } from 'date-fns-tz';
import { TIMEZONE } from '@/lib/config';

/**
 * Verifies if the user has hit their daily limit for orders/reservations.
 */
export async function checkUserDailyLimit(
    userId: string,
    limit: number = 10
): Promise<{ isExceeded: boolean; currentCount: number }> {
    try {
        // Daily limit boundaries ALWAYS evaluated in Santiago time.
        const santiagoNow = toZonedTime(new Date(), TIMEZONE);
        const todayStart = new Date(santiagoNow);
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date(santiagoNow);
        todayEnd.setHours(23, 59, 59, 999);

        // This checks both takeaway and reservations if they are stored in same table,
        // or just reservations for now. Polyrepo design should aggregate.
        const { count, error } = await supabase
            .from('reservations')
            .select('id', { count: 'exact', head: true })
            .eq('organizer_id', userId)
            .gte('date_time', todayStart.toISOString())
            .lte('date_time', todayEnd.toISOString());

        if (error) {
            console.error('[Business Logic] Failed tracking daily limits:', error);
            return { isExceeded: false, currentCount: 0 }; // Fail open
        }

        const currentCount = count || 0;
        return {
            isExceeded: currentCount >= limit,
            currentCount
        };
    } catch (err) {
        console.error('[Business Logic] Exception reading limits:', err);
        return { isExceeded: false, currentCount: 0 };
    }
}
