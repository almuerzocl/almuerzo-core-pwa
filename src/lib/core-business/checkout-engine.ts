import { UserProfile, OrderStatus, ReservationStatus } from "@/types";
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
     * Calcula la reputación "del día" (Basada en D-1 y anteriores).
     * No considera eventos del día actual para evitar sesgos operativos inmediatos.
     */
    async calculateDailyReputation(userId: string): Promise<ReputationSummary> {
        const today = startOfDay(new Date());

        // Histórico hasta ayer a última hora
        const { data, error } = await supabase
            .from('reservations')
            .select('status')
            .eq('organizer_id', userId)
            .lt('created_at', today.toISOString());

        if (error) {
            console.error("Error calculando reputación:", error);
            return { score: 100, level: 'Neutral', lastCalculation: today.toISOString() };
        }

        const total = data.length;
        if (total === 0) return { score: 100, level: 'Nuevo', lastCalculation: today.toISOString() };

        const positives = data.filter(r => r.status === 'COMPLETADA' || r.status === 'CONFIRMADA').length;
        const negatives = data.filter(r => r.status === 'NO SHOW').length;

        // Fórmula de reputación simplificada para Core V5
        const score = Math.max(0, Math.min(100, (positives * 10) - (negatives * 20) + 50));

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
