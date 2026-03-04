"use client";

import React, { useState, useEffect } from 'react';
import { Utensils, Calendar, Search, MapPin, SlidersHorizontal, ChevronRight, Star } from 'lucide-react';
import { RestaurantCard, RestaurantData } from "@/components/blocks/RestaurantCard";
import ReservationWizard from "@/components/blocks/ReservationWizard";
import { OliviaFloatingAssistant } from "@/components/blocks/OliviaFloatingAssistant";
import { LocationSelector } from "@/components/layout/LocationSelector";
import { supabase } from '@/lib/supabase';
import { Skeleton } from "@/components/ui/skeleton";

import { RestaurantActionModal } from '@/components/blocks/RestaurantActionModal';

export default function Home() {
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionRestaurant, setActionRestaurant] = useState<RestaurantData | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantData | null>(null);
  const [activeView, setActiveView] = useState<'restaurants' | 'menus'>('restaurants');
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          menu_items(*)
        `)
        .eq('is_active', true)
        .order('is_sponsored', { ascending: false });

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
        rating: Number(r.rating) || 5.0,
        totalReviews: Number(r.review_count) || 0,
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

  const filteredRestaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.cuisineType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filters = ["Todos", "Cerca de mi", "Económicos", "Mejor valorados", "Chilena", "Sushis"];

  return (
    <div className="w-full h-full max-w-lg mx-auto p-4 space-y-6 pb-24">

      {/* Barra de Ubicación / Dirección (Prominente) */}
      <div className="bg-card border border-border/50 rounded-3xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-primary/10 p-2.5 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entregar/Buscar en:</p>
            <LocationSelector />
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
      </div>

      {/* OlivIA Assistant (Floating Modal) */}
      <OliviaFloatingAssistant onRestaurantClick={setActionRestaurant} />

      {/* Selector de Vista (Restaurantes vs Menús) */}
      <div className="flex bg-muted/50 rounded-2xl p-1 gap-1 sticky top-0 z-30 backdrop-blur-md border border-border/50">
        <button
          onClick={() => setActiveView('restaurants')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeView === 'restaurants'
            ? "bg-background text-primary shadow-sm ring-1 ring-border/50"
            : "text-muted-foreground hover:bg-background/50"
            }`}
        >
          <Utensils className="w-4 h-4" />
          Restaurantes
        </button>
        <button
          onClick={() => setActiveView('menus')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeView === 'menus'
            ? "bg-background text-primary shadow-sm ring-1 ring-border/50"
            : "text-muted-foreground hover:bg-background/50"
            }`}
        >
          <Calendar className="w-4 h-4" />
          Menús del Día
        </button>
      </div>

      <div className="space-y-4">
        {/* Barra de Búsqueda */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder={activeView === 'restaurants' ? "Buscar por nombre, cocina..." : "Buscar platos, sopas..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-muted/30 border-2 border-transparent rounded-[1.5rem] outline-none focus:ring-0 focus:border-primary/20 focus:bg-background transition-all font-bold text-sm shadow-inner"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-background border border-border rounded-xl shadow-sm hover:bg-muted transition-colors">
            <SlidersHorizontal className="w-4 h-4 text-foreground/70" />
          </button>
        </div>

        {/* Filtros Rápidos */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 mask-fade-right">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border ${activeFilter === f
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                : "bg-card text-muted-foreground border-border hover:border-primary/30"
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-1 px-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {activeView === 'restaurants' ? "Restaurantes Cerca de Ti" : "Menús Ejecutivos para hoy"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {activeView === 'restaurants'
              ? `Mostrando ${filteredRestaurants.length} locales en Providencia`
              : "Los platos más frescos, disponibles hoy mismo"
            }
          </p>
        </div>
      </div>

      {/* Lista de Contenido */}
      <div className="flex flex-col gap-4 pb-12">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col gap-2 p-3 bg-card rounded-xl border border-border/60">
                <Skeleton className="h-28 w-full rounded-lg" />
                <div className="space-y-2 mt-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="flex justify-between mt-4">
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-12 rounded" />
                    <Skeleton className="h-4 w-12 rounded" />
                  </div>
                  <Skeleton className="h-4 w-10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : activeView === 'restaurants' ? (
          filteredRestaurants.length > 0 ? (
            filteredRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onClick={() => setActionRestaurant(restaurant)}
              />
            ))
          ) : (
            <div className="py-20 text-center">
              <p className="text-muted-foreground">No se encontraron restaurantes.</p>
            </div>
          )
        ) : activeView === 'menus' ? (
          filteredRestaurants.some(r => r.dailyMenus && r.dailyMenus.length > 0) ? (
            filteredRestaurants.map(r => {
              if (!r.dailyMenus || r.dailyMenus.length === 0) return null;
              return (
                <div key={r.id} className="bg-card border border-border rounded-3xl p-5 hover:border-primary/30 transition-all shadow-sm group">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">{r.name}</h3>
                    <div className="flex items-center gap-1 text-xs font-bold bg-muted px-2 py-1 rounded-lg text-muted-foreground">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      {r.rating.toFixed(1)}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {r.dailyMenus.map((menu: any) => (
                      <div key={menu.id} className="p-4 bg-muted/40 rounded-2xl flex items-center justify-between hover:bg-muted/60 transition-colors">
                        <div className="space-y-1">
                          <p className="font-bold text-sm text-foreground">{menu.name}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 max-w-[200px]">{menu.description}</p>
                        </div>
                        <div className="text-right pl-2">
                          <p className="font-black text-primary">${menu.price.toLocaleString('es-CL')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="w-full mt-4 h-12 rounded-2xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                    onClick={() => setActionRestaurant(r)}
                  >
                    Ver Restaurante
                  </button>
                </div>
              )
            })
          ) : (
            <div className="p-10 text-center space-y-4 bg-muted/20 rounded-3xl border border-dashed border-border">
              <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-foreground">No hay menús hoy</p>
                <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                  Ningún restaurante cercano ha publicado un Menú del Día para hoy.
                </p>
              </div>
            </div>
          )
        ) : null}
      </div>

      {selectedRestaurant && (
        <ReservationWizard
          restaurantId={selectedRestaurant.id}
          restaurantName={selectedRestaurant.name}
          onClose={() => setSelectedRestaurant(null)}
        />
      )}

      <RestaurantActionModal
        restaurant={actionRestaurant}
        isOpen={!!actionRestaurant}
        onClose={() => setActionRestaurant(null)}
        onReserve={(r) => setSelectedRestaurant(r)}
      />

    </div>
  );
}
