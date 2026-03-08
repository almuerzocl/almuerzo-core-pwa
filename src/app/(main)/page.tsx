import { createClient } from "@/utils/supabase/server";
import HomeClient from "./HomeClient";

// Force dynamic ensures we always get fresh data if needed, 
// but we can also use revalidate for aggressive caching.
export const dynamic = 'force-dynamic';

export default async function Page() {
    const supabase = await createClient();
    
    // Server-side fetch: MUCH faster than waiting for client mount
    const { data, error } = await supabase
        .from('restaurants')
        .select(`
            id, name, description, logo_url, cover_image_url, cuisine_type, price_level, 
            address, comuna, phone, has_reservations, has_takeaway, average_prep_time, 
            rating_google, rating_opinions, is_sponsored, is_featured, is_active,
            menu_items(id, name, description, price, is_menu_del_dia)
        `)
        .eq('is_active', true)
        .order('is_sponsored', { ascending: false })
        .limit(30);

    if (error) {
        console.error("Server-side fetch error:", error);
    }

    const initialRestaurants = (data || []).map((r: any) => ({
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
        isActive: r.is_active || true,
        dailyMenus: r.menu_items ? r.menu_items.filter((m: any) => m.is_menu_del_dia) : []
    }));

    return <HomeClient initialRestaurants={initialRestaurants} />;
}
