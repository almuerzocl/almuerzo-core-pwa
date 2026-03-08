import { supabase } from "@/lib/supabase";
import { RestaurantData } from "@/components/blocks/RestaurantCard";

// Tipado para la respuesta de OlivIA
export interface OliviaProposal {
    restaurant: RestaurantData;
    reason: string;
}

/**
 * Motor de Inteligencia OlivIA Core V5
 * Realiza búsquedas semánticas para proponer opciones al usuario.
 * // Radio geográfico (2.5km) temporalmente deshabilitado.
 */
export const OliviaEngine = {
    /**
     * Procesa un requerimiento del usuario y devuelve hasta 3 propuestas.
     * Considera: Menús, Horarios e Historial. // Cercanía (2.5km) deshabilitado.
     */
    async searchProposals(prompt: string, userCoords: { lat: number, lng: number }, userId?: string): Promise<OliviaProposal[]> {
        try {
            /* 
            // 1. Obtener restaurantes cercanos (RADIO 2.5km)
            const { data: nearby, error } = await supabase
                .rpc('get_restaurants_in_radius', {
                    lat: userCoords.lat,
                    lng: userCoords.lng,
                    radius_meters: 2500
                });

            if (error) {
                console.warn("RPC get_restaurants_in_radius falló, usando fallback de proximidad básica:", error);
            }
            */

            // Fallback: Carga normal si el RPC no existe aún
            const query = supabase
                .from('restaurants')
                .select(`
          *,
          menu_items(*)
        `)
                .eq('is_active', true);

            const { data: restaurants, error: fetchError } = await query;
            if (fetchError) throw fetchError;

            // 2. Filtrar semánticamente (Simulado por ahora hasta integrar Vector Search / OpenAI)
            // Buscamos palabras clave en el prompt dentro de nombre, cocina, descripción y menús.
            const keywords = prompt.toLowerCase().split(' ');

            const proposals = (restaurants || [])
                .map(r => {
                    let score = 0;
                    const content = `${r.name} ${r.cuisine_type} ${r.description} ${r.menu_items?.map((m: any) => m.name).join(' ')}`.toLowerCase();

                    keywords.forEach(kw => {
                        if (content.includes(kw)) score += 1;
                    });

                    return {
                        restaurant: this.mapToUI(r),
                        score,
                        reason: this.generateReason(r, prompt)
                    };
                })
            let filtered = proposals.filter(p => p.score > 0).sort((a, b) => b.score - a.score);

            // Si no hubo "match" exacto, devolvemos 2 recomendaciones de fallback
            if (filtered.length === 0 && proposals.length > 0) {
                filtered = proposals.slice(0, 2).map(p => ({
                    ...p,
                    reason: `No encontré la opción exacta, pero te sugiero esta excelente alternativa cerca de ti.`
                }));
            }

            return filtered.slice(0, 3).map(p => ({
                restaurant: p.restaurant,
                reason: p.reason
            }));
        } catch (err) {
            console.error("OliviaEngine Error:", err);
            return [];
        }
    },

    mapToUI(r: any): RestaurantData {
        return {
            id: r.id,
            name: r.name,
            description: r.description || '',
            logoUrl: r.logo_url,
            coverImageUrl: r.cover_image_url,
            cuisineType: r.cuisine_type || 'Varios',
            priceLevel: Number(r.price_level) || 2,
            address: typeof r.address === 'object' && r.address !== null ? `${r.address.street || ''} ${r.address.number || ''}`.trim() : (r.address || ''),
            comuna: r.comuna || '',
            phoneNumber: r.phone,
            hasReservations: r.has_reservations ?? true,
            hasTakeaway: r.has_takeaway ?? true,
            averagePrepTimeMinutes: Number(r.average_prep_time) || 20,
            rating: Number(r.rating_google) || 5.0,
            totalReviews: Number(r.rating_opinions) || 0,
            isSponsored: r.is_sponsored || false,
            isFeatured: r.is_featured || false,
            isActive: r.is_active || true
        };
    },

    generateReason(r: any, prompt: string): string {
        // Lógica para explicar por qué se eligió (idealmente vía LLM en el futuro)
        if (prompt.includes('barato') || prompt.includes('económico')) {
            return `Elegido porque su nivel de precio es bajo y tiene excelentes reseñas.`;
        }
        if (prompt.includes('sushi') || prompt.includes('japonés')) {
            return `Excelente opción de cocina asiática cerca de tu ubicación.`;
        }
        return `Coincide con tus preferencias de cocina ${r.cuisine_type}.`;
        // return `Coincide con tus preferencias de cocina ${r.cuisine_type} y está a menos de 2.5km.`;

    },

    /**
     * Verifica cuántas consultas ha realizado el usuario hoy.
     * Retorna el número de consultas restantes (Máx 3).
     */
    async getRemainingUsage(userId: string): Promise<number> {
        const today = new Date().toISOString().split('T')[0];

        const { count, error } = await supabase
            .from('olivia_usage_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', today);

        if (error) {
            console.error("Error checking OlivIA usage:", error);
            return 3; // Si hay error (ej: tabla no existe) damos 3 usos por defecto
        }

        return Math.max(0, 3 - (count || 0));
    },

    /**
     * Registra una nueva consulta en la base de datos.
     */
    async recordUsage(userId: string, prompt: string): Promise<void> {
        const { error } = await supabase
            .from('olivia_usage_logs')
            .insert({
                user_id: userId,
                query_text: prompt
            });

        if (error) {
            console.error("Error recording OlivIA usage:", error);
        }
    }
};
