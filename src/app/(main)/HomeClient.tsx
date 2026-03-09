"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Utensils, Calendar, Search, MapPin, Star, Bell, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { RestaurantCard, RestaurantData } from "@/components/blocks/RestaurantCard";
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';

// Lazy load heavy components
const ReservationWizard = dynamic(() => import("@/components/blocks/ReservationWizard"), { ssr: false });
const RestaurantActionModal = dynamic(() => import('@/components/blocks/RestaurantActionModal').then(m => m.RestaurantActionModal), { ssr: false });
const OliviaFloatingAssistant = dynamic(() => import("@/components/blocks/OliviaFloatingAssistant").then(m => m.OliviaFloatingAssistant), { ssr: false });

interface HomeClientProps {
    initialRestaurants: RestaurantData[];
}

export default function HomeClient({ initialRestaurants }: HomeClientProps) {
    const { profile } = useAuth();
    const [restaurants, setRestaurants] = useState<RestaurantData[]>(initialRestaurants);
    const [loading, setLoading] = useState(false);
    const [actionRestaurant, setActionRestaurant] = useState<RestaurantData | null>(null);
    const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantData | null>(null);
    const [activeView, setActiveView] = useState<'restaurants' | 'menus'>('restaurants');
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("Todos");

    const filters = ["Todos", "Cerca de mi", "Mejor valorados", "Económicos"];

    useEffect(() => {
        // Hydrate or refresh if needed
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
        <div className="flex flex-col min-h-screen bg-slate-50/30">
            {/* NO Header here - already in MainLayout */}

            <main className="flex-1 w-full max-w-lg mx-auto p-4 space-y-6 pb-24">
                
                {/* 1. Selector de Vista (Switch) */}
                <div className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-border/40 shadow-sm">
                    <button
                        onClick={() => setActiveView('restaurants')}
                        className={cn(
                            "flex-1 h-11 rounded-[1.1rem] text-xs font-bold transition-all flex items-center justify-center gap-2",
                            activeView === 'restaurants' ? "bg-white text-primary shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Utensils className="w-4 h-4" />
                        Restaurantes
                    </button>
                    <button
                        onClick={() => setActiveView('menus')}
                        className={cn(
                            "flex-1 h-11 rounded-[1.1rem] text-xs font-bold transition-all flex items-center justify-center gap-2",
                            activeView === 'menus' ? "bg-white text-primary shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Calendar className="w-4 h-4" />
                        Menús del Día
                    </button>
                </div>

                {/* 2. Barra de Búsqueda y Filtros */}
                <div className="space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder={activeView === 'restaurants' ? "Busca tu sabor favorito..." : "Busca platos, sopas..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 pl-12 pr-14 bg-white border-2 border-transparent rounded-[1.3rem] outline-none focus:ring-0 focus:border-primary/20 transition-all font-bold text-sm shadow-sm"
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-muted/40 rounded-xl flex items-center justify-center">
                            <SlidersHorizontal className="w-4 h-4 text-foreground/60" />
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none px-0.5">
                        {filters.map((f) => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={cn(
                                    "whitespace-nowrap px-5 py-2.5 rounded-2xl text-[11px] font-extrabold transition-all border",
                                    activeFilter === f 
                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                                        : "bg-white text-muted-foreground border-border hover:border-primary/30"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Título de Sección dinámico */}
                <section className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-black tracking-tighter text-foreground">
                            {activeView === 'restaurants' ? "Restaurantes Cerca de Ti" : "Menús de Hoy"}
                        </h2>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                            {loading ? "Cargando locales..." : `Mostrando ${filteredRestaurants.length} locales en ${profile?.default_address?.split(',').pop()?.trim() || 'Santiago'}`}
                        </p>
                    </div>

                    <div className="flex flex-col gap-5">
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
                            filteredRestaurants.filter(r => r.dailyMenus && r.dailyMenus.length > 0).map(r => (
                                <div key={r.id} className="bg-white border border-border/60 rounded-[2rem] p-6 hover:border-primary/30 transition-all shadow-sm group">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-lg">{r.name}</h3>
                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase">HOY</span>
                                    </div>
                                    <div className="space-y-3">
                                        {r.dailyMenus?.map((menu: any) => (
                                            <div key={menu.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-transparent hover:border-primary/20 transition-colors">
                                                <p className="font-bold text-sm text-foreground/80">{menu.name}</p>
                                                <p className="font-black text-primary">${menu.price.toLocaleString('es-CL')}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}

                        {!loading && filteredRestaurants.length === 0 && (
                            <div className="py-20 text-center space-y-4 bg-white/40 rounded-[2.5rem] border border-dashed border-border">
                                <MapPin className="w-12 h-12 text-muted-foreground/20 mx-auto" />
                                <p className="text-muted-foreground font-medium">No encontramos locales con esos filtros.</p>
                                <button onClick={() => { setActiveFilter("Todos"); setSearchQuery(""); }} className="text-primary font-bold text-sm underline underline-offset-4">Ver todos</button>
                            </div>
                        )}
                    </div>
                </section>
            </main>

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

