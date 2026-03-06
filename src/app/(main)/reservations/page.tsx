"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Reservation } from "@/types";
import { Calendar, MapPin, Users, Clock, MessageSquare, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ReservationsPage() {
    const { user } = useAuth();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        if (user) {
            fetchReservations();
        }
    }, [user]);

    const fetchReservations = async () => {
        try {
            const { data, error } = await supabase
                .from("reservations")
                .select(`
                    *,
                    restaurant:restaurants(name, address, id)
                `)
                .eq("organizer_id", user?.id)
                .order("date_time", { ascending: true });

            if (error) throw error;
            setReservations(data as any[]);
        } catch (error) {
            console.error("Error fetching reservations:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'COMPLETADA': return 'bg-green-100 text-green-700 border-green-200';
            case 'CONFIRMADA': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'CHECK-IN CLIENTE': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'PENDIENTE': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'CANCELADA':
            case 'RECHAZADA': return 'bg-red-100 text-red-700 border-red-200';
            case 'NO_SHOW': return 'bg-gray-800 text-white border-gray-900';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const activeStatuses = ['CREADA', 'PENDIENTE', 'CONFIRMADA', 'CHECK-IN CLIENTE', 'MODIFICADA'];
    const activeReservations = reservations.filter((r: any) => activeStatuses.includes(r.status?.toUpperCase() || 'CREADA'));
    const historyReservations = reservations.filter((r: any) => !activeStatuses.includes(r.status?.toUpperCase() || 'CREADA'));

    return (
        <div className="w-full max-w-lg mx-auto p-4 space-y-6 pb-24">
            <header className="space-y-1">
                <h1 className="text-2xl font-black tracking-tight text-foreground">Mis Reservas</h1>
                <p className="text-sm text-muted-foreground">Gestiona tus próximas visitas y el historial.</p>
            </header>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-muted/50 animate-pulse rounded-3xl" />
                    ))}
                </div>
            ) : reservations.length > 0 ? (
                <div className="space-y-4">
                    {activeReservations.length > 0 ? (
                        activeReservations.map((res: any) => (
                            <div key={res.id}>
                                <ReservationCard res={res} getStatusColor={getStatusColor} />
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center bg-muted/30 rounded-3xl border border-dashed border-border">
                            <p className="text-sm text-muted-foreground">No tienes reservas activas.</p>
                        </div>
                    )}

                    {historyReservations.length > 0 && (
                        <div className="pt-6 border-t border-border mt-6">
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-2xl hover:bg-muted transition-colors font-bold text-foreground"
                            >
                                <span className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-muted-foreground" />
                                    Historial de Reservas
                                </span>
                                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${showHistory ? 'rotate-180' : ''}`} />
                            </button>

                            {showHistory && (
                                <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                    {historyReservations.map((res: any) => (
                                        <div key={res.id}>
                                            <ReservationCard res={res} getStatusColor={getStatusColor} isHistory />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="py-12 text-center space-y-6">
                    <div className="bg-primary/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto border border-primary/10">
                        <Calendar className="w-10 h-10 text-primary/40" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-bold text-xl">¿Aún sin planes?</h3>
                        <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                            Tus reservas aparecerán aquí una vez que elijas un restaurante.
                        </p>
                    </div>
                    <Link href="/">
                        <Button className="rounded-2xl h-12 px-8 font-bold">Explorar Restaurantes</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}

function ReservationCard({ res, getStatusColor, isHistory = false }: { res: any, getStatusColor: (status: string) => string, isHistory?: boolean }) {
    const router = useRouter();
    const status = (res.status || 'CREADA').toUpperCase();
    const ticketUrl = `/reservations/${res.unique_code || res.id}`;

    return (
        <div className={`space-y-2 ${isHistory ? 'opacity-80 grayscale-[0.2]' : ''}`}>
            {/* Clickable Card Container */}
            <div
                onClick={() => router.push(ticketUrl)}
                className={`cursor-pointer block group bg-card border border-border rounded-3xl p-5 hover:shadow-lg hover:border-primary/20 transition-all space-y-4 relative overflow-hidden active:scale-[0.98] ${isHistory ? 'bg-muted/10' : ''}`}
            >
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                            {res.restaurant?.name || "Restaurante"}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">
                                {typeof res.restaurant?.address === 'object' && res.restaurant?.address !== null
                                    ? `${res.restaurant.address.street || ''} ${res.restaurant.address.number || ''}`.trim()
                                    : (res.restaurant?.address || "Dirección no disponible")}
                            </span>
                        </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusColor(res.status)}`}>
                        {res.status || 'CREADA'}
                    </span>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                        <Calendar className="w-4 h-4 text-primary" />
                        {format(new Date(res.date_time), "EEE d 'de' MMMM", { locale: es })}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                        <Clock className="w-4 h-4 text-primary" />
                        {format(new Date(res.date_time), "HH:mm 'hrs'")}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                        <Users className="w-4 h-4 text-primary" />
                        {res.guest_ids?.length + 1 || 1} Personas
                    </div>
                </div>
            </div>

            {/* External Action Buttons */}
            {!isHistory && status === 'CONFIRMADA' && (
                <div className="pt-1">
                    <Button
                        onClick={() => router.push(`${ticketUrl}?action=checkin`)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold py-6 shadow-lg shadow-blue-500/20 uppercase tracking-widest text-[11px]"
                    >
                        Validar Llegada (Check-in)
                    </Button>
                </div>
            )}
        </div>
    );
}
