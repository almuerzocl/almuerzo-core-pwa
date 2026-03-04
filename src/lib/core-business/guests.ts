import { supabase } from '@/lib/supabase';

/**
 * Matches an email or phone number to an existing platform user.
 * Avoids RLS blocks by using the secure `find_user_public_info` RPC.
 */
export async function matchExistingUser(email?: string, phone?: string): Promise<string | null> {
    if (!email && !phone) return null;

    try {
        const { data, error } = await supabase.rpc('find_user_public_info', {
            p_email: email || null,
            p_phone: phone || null
        });

        if (!error && data && data.length > 0) {
            return data[0].id;
        }
        return null;
    } catch (err) {
        console.error('[Business Logic] Failed mapping user ID:', err);
        return null;
    }
}
