import { UserProfile, OrderStatus, ReservationStatus } from "@/types";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { startOfDay, subDays } from "date-fns";

export interface CheckoutContext {
    user: UserProfile;
    restaurantId: string;
    items?: any[];
}

export interface ReputationSummary {
    score: number;
    level: string;
    lastCalculation: string;
}

/**
 * Motor de Checkout Core V5
 * Encapsula las reglas de negocio críticas para transacciones de pedidos y reservas.
 */
export const CheckoutEngine = {
    /**
     * Valida y prepara los datos del cliente asegurando que no se pidan datos redundantes.
     */
    prepareSessionData(profile: UserProfile) {
        return {
            fullName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            contactPhone: profile.phone_number || profile.phone || '',
            email: profile.email,
            isElite: profile.account_type === 'elite'
        };
    },

    /**
     * Asegura un perfil válido incluso si el usuario no tiene entrada en la tabla 'profiles'.
     * Previene definición redundante de objetos de usuario en los componentes.
     */
    getSafeProfile(user: User | null, profile: UserProfile | null): UserProfile {
        if (!user) throw new Error("User required for safe profile mapping");
        
        return profile || {
            id: user.id,
            email: user.email || '',
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            phone_number: user.phone || '',
            account_type: 'free',
            total_reservations: 0,
            reservation_reputation: 100,
            role: 'user',
            created_at: new Date().toISOString()
        } as UserProfile;
    },

    /**
     * Calcula la reputación "del día" (Basada en D-1 y anteriores).
     * No considera eventos del día actual para evitar sesgos operativos inmediatos.
     */
    async calculateDailyReputation(userId: string): Promise<ReputationSummary> {
        const today = startOfDay(new Date());

        // Histórico hasta ayer a última hora (D-1)
        const [resResponse, orderResponse] = await Promise.all([
            supabase
                .from('reservations')
                .select('status')
                .eq('organizer_id', userId)
                .lt('created_at', today.toISOString()),
            supabase
                .from('takeaway_orders')
                .select('status')
                .eq('user_id', userId)
                .lt('created_at', today.toISOString())
        ]);

        if (resResponse.error || orderResponse.error) {
            console.error("Error calculando reputación:", resResponse.error || orderResponse.error);
            return { score: 100, level: 'Neutral', lastCalculation: today.toISOString() };
        }

        const resData = resResponse.data || [];
        const orderData = orderResponse.data || [];
        const totalTransactions = resData.length + orderData.length;

        // User without transactions should have 100% reputation
        if (totalTransactions === 0) {
            return { score: 100, level: 'Nuevo', lastCalculation: today.toISOString() };
        }

        const resNegatives = resData.filter(r => r.status === 'NO_SHOW').length;
        const orderNegatives = orderData.filter(o => o.status === 'NO_RETIRADO').length;
        const totalNegatives = resNegatives + orderNegatives;

        // Formula: Start at 100 and penalize negatives.
        // We use 20 pts penalty per negative, with a floor of 0.
        const score = Math.max(0, 100 - (totalNegatives * 20));

        let level = 'Bronce';
        if (score > 80) level = 'Oro';
        else if (score > 60) level = 'Plata';

        return { score, level, lastCalculation: today.toISOString() };
    },

    /**
     * Aplica reglas de negocio específicas según el tipo de cuenta (Free vs Elite).
     */
    applyAccountBenefits(context: CheckoutContext) {
        const { user } = context;
        if (user.account_type === 'elite') {
            return {
                priority: 1,
                serviceFee: 0,
                reservationGuarantee: true,
                badge: 'ELITE'
            };
        }
        return {
            priority: 0,
            serviceFee: 500, // Placeholder
            reservationGuarantee: false,
            badge: 'FREE'
        };
    }
};
