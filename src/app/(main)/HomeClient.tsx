"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Utensils, Calendar, Search, MapPin, SlidersHorizontal, ChevronRight, Star, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { RestaurantCard, RestaurantData } from "@/components/blocks/RestaurantCard";
import dynamic from 'next/dynamic';
import { LocationSelector } from "@/components/layout/LocationSelector";
import { supabase } from '@/lib/supabase';

const ReservationWizard = dynamic(() => import("@/components/blocks/ReservationWizard"), { ssr: false });
const RestaurantActionModal = dynamic(() => import('@/components/blocks/RestaurantActionModal').then(m => m.RestaurantActionModal), { ssr: false });
const OliviaFloatingAssistant = dynamic(() => import("@/components/blocks/OliviaFloatingAssistant").then(m => m.OliviaFloatingAssistant), { ssr: false });

interface HomeClientProps {
    initialRestaurants: RestaurantData[];
}

export default function HomeClient({ initialRestaurants }: HomeClientProps) {
    const { user, profile, refreshProfile } = useAuth();
    const [restaurants, setRestaurants] = useState<RestaurantData[]>(initialRestaurants);
    const [loading, setLoading] = useState(false);
    const [actionRestaurant, setActionRestaurant] = useState<RestaurantData | null>(null);
    const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantData | null>(null);
    const [activeView, setActiveView] = useState<'restaurants' | 'menus'>('restaurants');
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("Todos");

    const filters = ["Todos", "Cerca de mi", "Mejor valorados", "Económicos"];

    useEffect(() => {
        // If we want to refresh on mount anyway (to get latest), or just trust server data.
        // Let's at least fetch once if initial is empty
        if (initialRestaurants.length === 0) {
            fetchRestaurants();
        }
    }, [initialRestaurants]);

    const fetchRestaurants = async () => {
        setLoading(true);
        try {
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

            // Note: In a real scenario we'd use .eq('menu_items.is_menu_del_dia', true) if supported by the join type
            // but for now let's keep it simple and optimized in payload.

            if (error) throw error;

            const mapped: RestaurantData[] = (data || []).map((r: any) => ({
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

            setRestaurants(mapped);
        } catch (error) {
            console.error("Error loading restaurants:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRestaurants = useMemo(() => {
        return restaurants.filter(r => {
            const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.cuisineType.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;

            const isFavorite = profile?.favorite_restaurant_ids?.includes(r.id) ||
                profile?.subscribed_daily_menu_ids?.includes(r.id);

            if (isFavorite) return true;

            if (activeFilter === "Todos") return true;
            if (activeFilter === "Económicos") return r.priceLevel <= 2;
            if (activeFilter === "Mejor valorados") return r.rating >= 4.5;
            if (activeFilter === "Cerca de mi") {
                if (profile?.default_address && r.comuna) {
                    return profile.default_address.toLowerCase().includes(r.comuna.toLowerCase());
                }
                return true;
            }
            return true;
        });
    }, [restaurants, searchQuery, activeFilter, profile]);

    return (
        <div className="min-h-screen bg-background px-4 pt-4 pb-24 space-y-6 max-w-md mx-auto relative">
            <header className="flex items-center justify-between">
                <LocationSelector />
                <button className="relative w-11 h-11 flex items-center justify-center bg-card border border-border rounded-2xl shadow-sm hover:bg-muted transition-all active:scale-95 group">
                    <Bell className="w-5 h-5 text-foreground/70 group-hover:text-primary transition-colors" />
                    <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full border-2 border-background" />
                </button>
            </header>

            <div className="flex bg-muted/30 p-1.5 rounded-[1.5rem] border border-border/40">
                <button
                    onClick={() => setActiveView('restaurants')}
                    className={cn(
                        "flex-1 h-11 rounded-[1.1rem] text-xs font-bold transition-all flex items-center justify-center gap-2",
                        activeView === 'restaurants' ? "bg-background text-primary shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Utensils className="w-4 h-4" />
                    Restaurantes
                </button>
                <button
                    onClick={() => setActiveView('menus')}
                    className={cn(
                        "flex-1 h-11 rounded-[1.1rem] text-xs font-bold transition-all flex items-center justify-center gap-2",
                        activeView === 'menus' ? "bg-background text-primary shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Calendar className="w-4 h-4" />
                    Menús del Día
                </button>
            </div>

            <div className="space-y-4">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder={activeView === 'restaurants' ? "Buscar por nombre, cocina..." : "Buscar platos, sopas..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-muted/30 border-2 border-transparent rounded-[1.5rem] outline-none focus:ring-0 focus:border-primary/20 focus:bg-background transition-all font-bold text-sm shadow-inner"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 mask-fade-right">
                    {filters.map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={cn(
                                "whitespace-nowrap px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border",
                                activeFilter === f ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-card text-muted-foreground border-border hover:border-primary/30"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-4 pb-12">
                {activeView === 'restaurants' ? (
                    filteredRestaurants.map((restaurant, idx) => {
                        const isFavorite = profile?.favorite_restaurant_ids?.includes(restaurant.id);
                        const isSubscribed = profile?.subscribed_daily_menu_ids?.includes(restaurant.id);

                        return (
                            <RestaurantCard
                                key={restaurant.id}
                                restaurant={restaurant}
                                onClick={() => setActionRestaurant(restaurant)}
                                priority={idx < 4}
                                isFavorite={isFavorite}
                                isSubscribed={isSubscribed}
                            />
                        );
                    })
                ) : (
                    // Menu view logic... (simplified here for brevity, keeping existing functionality)
                    filteredRestaurants.filter(r => r.dailyMenus && r.dailyMenus.length > 0).map(r => (
                        <div key={r.id} className="bg-card border border-border rounded-3xl p-5 hover:border-primary/30 transition-all shadow-sm group">
                            <h3 className="font-bold text-lg mb-4">{r.name}</h3>
                            <div className="space-y-3">
                                {r.dailyMenus?.map((menu: any) => (
                                    <div key={menu.id} className="p-4 bg-muted/40 rounded-2xl flex items-center justify-between">
                                        <p className="font-bold text-sm">{menu.name}</p>
                                        <p className="font-black text-primary">${menu.price.toLocaleString('es-CL')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <OliviaFloatingAssistant />
            
            {selectedRestaurant && (
                <ReservationWizard
                    restaurantId={selectedRestaurant.id}
                    restaurantName={selectedRestaurant.name}
                    onClose={() => setSelectedRestaurant(null)}
                />
            )}

            {actionRestaurant && (
                <RestaurantActionModal
                    restaurant={actionRestaurant}
                    isOpen={!!actionRestaurant}
                    onClose={() => setActionRestaurant(null)}
                    onReserve={(r) => setSelectedRestaurant(r)}
                />
            )}
        </div>
    );
}

