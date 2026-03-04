"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    MapPin,
    Store,
    ShoppingBag,
    Clock,
    Info,
    Menu as MenuIcon,
    Users,
    ChevronRight,
    Star,
    CalendarCheck,
    Coffee,
    Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import ReservationWizard from "@/components/blocks/ReservationWizard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RestaurantDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showReservation, setShowReservation] = useState(false);
    const [activeTab, setActiveTab] = useState("info");

    useEffect(() => {
        const fetchRestaurant = async () => {
            const { data } = await supabase.from('restaurants').select('*').eq('id', id).single();
            setRestaurant(data);
            setLoading(false);
        };
        if (id) fetchRestaurant();
    }, [id]);

    if (loading) {
        return (
            <div className="w-full max-w-lg mx-auto p-4 space-y-6 pt-10">
                <div className="h-64 bg-slate-100 animate-pulse rounded-[2.5rem]" />
                <div className="space-y-3">
                    <div className="h-8 w-2/3 bg-slate-100 animate-pulse rounded-xl" />
                    <div className="h-4 w-full bg-slate-100 animate-pulse rounded-lg" />
                    <div className="h-4 w-full bg-slate-100 animate-pulse rounded-lg" />
                </div>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                    <Store className="w-10 h-10 text-slate-300" />
                </div>
                <h1 className="text-xl font-bold">Restaurante no encontrado</h1>
                <Button onClick={() => router.push('/')} variant="outline" className="rounded-2xl">
                    Volver al inicio
                </Button>
            </div>
        );
    }

    const addressStr = typeof restaurant.address === 'object' && restaurant.address !== null
        ? `${restaurant.address.street || ''} ${restaurant.address.number || ''}`.trim()
        : (restaurant.address || "Dirección no disponible");

    const daysTranslation: Record<string, string> = {
        monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles", thursday: "Jueves",
        friday: "Viernes", saturday: "Sábado", sunday: "Domingo"
    };

    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    return (
        <div className="w-full min-h-screen bg-slate-50/50 pb-32">
            {/* Action Bar Floating Top */}
            <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center pointer-events-none">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="bg-white/90 backdrop-blur-md rounded-2xl text-slate-900 shadow-sm border border-slate-200 pointer-events-auto active:scale-95 transition-transform"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex gap-2 pointer-events-auto">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="bg-white/90 backdrop-blur-md rounded-2xl text-slate-900 shadow-sm border border-slate-200 active:scale-95 transition-transform"
                    >
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    </Button>
                </div>
            </div>

            {/* Premium Hero Image */}
            <div className="relative h-80 w-full overflow-hidden">
                {restaurant.cover_image_url ? (
                    <img
                        src={restaurant.cover_image_url}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <Store className="w-16 h-16 text-slate-300" />
                    </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-50/50 to-transparent" />
            </div>

            {/* Main Content Card */}
            <div className="max-w-lg mx-auto -mt-12 relative px-4">
                <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 p-6 md:p-8 border border-slate-100 space-y-6">
                    {/* Brand & Header */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <h1 className="text-3xl font-black tracking-tighter text-slate-900 leading-tight">
                                    {restaurant.name}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-widest px-2 shadow-none">
                                        {restaurant.cuisine_type || 'Gourmet'}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                                        <MapPin className="w-3 h-3 text-primary" />
                                        {restaurant.comuna || 'Santiago'}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-amber-400 text-amber-950 font-black px-3 py-2 rounded-2xl text-lg flex items-center gap-1.5 shadow-lg shadow-amber-400/20 scale-105">
                                <Star className="w-5 h-5 fill-current" />
                                {Number(restaurant.rating || 5).toFixed(1)}
                            </div>
                        </div>

                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                            {restaurant.description || "Un espacio diseñado para los amantes de la buena mesa, con ingredientes frescos y atención de primer nivel."}
                        </p>
                    </div>

                    <div className="h-px bg-slate-100 w-full" />

                    {/* Navigation Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-3 bg-slate-50 p-1.5 rounded-2xl h-14 border border-slate-100 mb-6">
                            <TabsTrigger value="info" className="rounded-xl font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">
                                <Info className="w-3.5 h-3.5 mr-1.5" /> Detalles
                            </TabsTrigger>
                            <TabsTrigger value="hours" className="rounded-xl font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">
                                <Clock className="w-3.5 h-3.5 mr-1.5" /> Horarios
                            </TabsTrigger>
                            <TabsTrigger value="spaces" className="rounded-xl font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">
                                <Users className="w-3.5 h-3.5 mr-1.5" /> Espacios
                            </TabsTrigger>
                        </TabsList>

                        {/* INFO TAB */}
                        <TabsContent value="info" className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-slate-50 p-5 rounded-3xl space-y-4 border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-100">
                                        <MapPin className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 text-xs">Ubicación</p>
                                        <p className="text-sm font-bold text-slate-800 tracking-tight">{addressStr}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-100">
                                        <Smartphone className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 text-xs">Reservas Digitales</p>
                                        <p className="text-sm font-bold text-slate-800 tracking-tight">Confirmación Inmediata v5</p>
                                    </div>
                                </div>
                            </div>

                            {/* Features Grid - Only show if we had real data from DB */}
                            {restaurant.amenities && (
                                <div className="grid grid-cols-2 gap-3">
                                    {restaurant.amenities.map((amenity: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                            <span className="text-[11px] font-bold text-slate-600">{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* HOURS TAB */}
                        <TabsContent value="hours" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white space-y-4 shadow-xl shadow-slate-900/20 relative overflow-hidden">
                                <Clock className="absolute -right-4 -top-4 w-24 h-24 text-white/5 rotate-12" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    Configuración de Apertura
                                </h3>
                                <div className="space-y-2.5">
                                    {Object.entries(daysTranslation).map(([key, label]) => {
                                        const isToday = currentDay === key;
                                        const hours = restaurant.operating_hours?.[key] || restaurant.opening_hours?.[key];
                                        const hoursStr = Array.isArray(hours) && hours.length > 0
                                            ? `${hours[0].open} - ${hours[0].close}`
                                            : (hours?.open ? `${hours.open} - ${hours.close}` : "Cerrado");

                                        return (
                                            <div key={key} className={cn(
                                                "flex justify-between items-center py-2 px-1 transition-all rounded-xl",
                                                isToday ? "bg-white/10 scale-105 px-3 border border-white/10" : "opacity-60"
                                            )}>
                                                <span className="font-bold text-sm tracking-tight">{label}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black mono text-primary">{hoursStr}</span>
                                                    {isToday && <Badge className="bg-emerald-500 text-[8px] h-4 rounded-full border-none">HOY</Badge>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </TabsContent>

                        {/* SPACES TAB */}
                        <TabsContent value="spaces" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-4">
                                <div className="flex flex-col gap-4">
                                    {restaurant.space_capacities ? (
                                        Object.entries(restaurant.space_capacities).map(([space, cap]: [string, any]) => (
                                            <div key={space} className="flex items-center justify-between p-5 bg-white border-2 border-slate-50 rounded-3xl shadow-sm group hover:border-primary/20 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        <Store className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">{space}</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Capacidad máxima</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-black text-slate-900">{cap}</span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase ml-1">Lugares</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Configuración de espacios no detallada</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Premium Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-6 z-40 bg-gradient-to-t from-background via-background to-transparent pt-12">
                <div className="max-w-lg mx-auto grid grid-cols-2 gap-4">
                    <Button
                        disabled={!restaurant.has_reservations}
                        onClick={() => setShowReservation(true)}
                        className={cn(
                            "h-20 rounded-[2rem] flex flex-col gap-1.5 font-black shadow-2xl transition-all active:scale-95 group overflow-hidden relative",
                            restaurant.has_reservations
                                ? "bg-slate-900 text-white shadow-slate-900/20"
                                : "bg-slate-100 text-slate-400 opacity-50"
                        )}
                    >
                        <CalendarCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <div className="text-center flex flex-col">
                            <span className="text-xs uppercase tracking-tight">Reservar Mesa</span>
                            <span className="text-[8px] opacity-60 font-black uppercase tracking-[0.1em]">Instantáneo</span>
                        </div>
                        {/* Interactive glow effect */}
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>

                    <Button
                        disabled={!restaurant.has_takeaway}
                        variant="outline"
                        onClick={() => router.push(`/restaurant/${id}/menu`)}
                        className={cn(
                            "h-20 rounded-[2rem] flex flex-col gap-1.5 font-black border-2 transition-all active:scale-95 shadow-lg group relative overflow-hidden",
                            restaurant.has_takeaway
                                ? "border-primary bg-primary text-white shadow-primary/20 hover:bg-primary/95"
                                : "bg-slate-100 border-transparent text-slate-400 opacity-50"
                        )}
                    >
                        <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <div className="text-center flex flex-col">
                            <span className="text-xs uppercase tracking-tight">Pedir p/ Llevar</span>
                            <span className="text-[8px] opacity-70 font-black uppercase tracking-[0.1em]">Menú Digital</span>
                        </div>
                        {/* Interactive shimmer */}
                        <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-40 group-hover:animate-shimmer" />
                    </Button>
                </div>
            </div>

            {showReservation && (
                <ReservationWizard
                    restaurantId={id}
                    restaurantName={restaurant.name}
                    address={addressStr}
                    onClose={() => setShowReservation(false)}
                />
            )}
        </div>
    );
}
