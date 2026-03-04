"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, MapPin, Calendar, Clock, Users, Ticket, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNotifications } from "@/context/NotificationContext";

export default function ReservationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [reservation, setReservation] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchReservation();
            subscribeToChanges();
        }
    }, [params.id]);

    const fetchReservation = async () => {
        try {
            // Determine if params.id is a UUID or a unique_code
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id as string);

            let query = supabase
                .from("reservations")
                .select(`
                    *,
                    restaurant:restaurants(name, address, id, photo_url, phone)
                `);

            if (isUUID) {
                query = query.eq("id", params.id);
            } else {
                query = query.eq("unique_code", params.id);
            }

            const { data, error } = await query.single();

            if (error) throw error;
            setReservation(data);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToChanges = () => {
        const channel = supabase
            .channel(`reservation-${params.id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'reservations', filter: `id=eq.${params.id}` },
                (payload) => {
                    setReservation((prev: any) => ({ ...prev, ...payload.new }));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Cargando ticket...</div>;
    if (!reservation) return <div className="p-8 text-center">No se encontró la reserva.</div>;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETADA': return <CheckCircle2 className="w-6 h-6 text-green-500" />;
            case 'CONFIRMADA': return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
            case 'CHECK-IN CLIENTE': return <MapPin className="w-6 h-6 text-blue-500 animate-bounce" />;
            case 'PENDIENTE': return <Clock3 className="w-6 h-6 text-yellow-500" />;
            case 'RECHAZADA':
            case 'CANCELADA': return <XCircle className="w-6 h-6 text-red-500" />;
            case 'NO SHOW': return <XCircle className="w-6 h-6 text-gray-800" />;
            default: return <Clock3 className="w-6 h-6 text-gray-400" />;
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto p-4 space-y-6 pb-24">
            <header className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-black tracking-tight">Ticket Digital</h1>
            </header>

            {/* Ticket Card */}
            <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5">
                <div className="bg-primary p-8 text-white relative">
                    {/* Decorative holes */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full" />
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full" />

                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Restaurante</p>
                                <h2 className="text-2xl font-black leading-tight">{reservation.restaurant?.name}</h2>
                            </div>
                            <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md">
                                <Ticket className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Código de Reserva</p>
                                <p className="text-3xl font-black tracking-tighter">{reservation.unique_code}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Estado</p>
                                <p className="font-bold">{reservation.status}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8 bg-card relative">
                    {/* Dashed line */}
                    <div className="absolute -top-px left-8 right-8 border-t-2 border-dashed border-border/50" />

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Fecha</span>
                            </div>
                            <p className="font-bold">{format(new Date(reservation.date_time), "EEE d MMM", { locale: es })}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Hora</span>
                            </div>
                            <p className="font-bold">{format(new Date(reservation.date_time), "HH:mm")}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Users className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Personas</span>
                            </div>
                            <p className="font-bold">{reservation.party_size} Invitados</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Ubicación</span>
                            </div>
                            <p className="font-bold truncate text-sm">
                                {typeof reservation.restaurant?.address === 'object' && reservation.restaurant?.address !== null
                                    ? `${reservation.restaurant.address.street || ''} ${reservation.restaurant.address.number || ''}`.trim()
                                    : (reservation.restaurant?.address || "Dirección no disponible")}
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                            <div className="flex items-center gap-3">
                                {getStatusIcon(reservation.status)}
                                <div>
                                    <p className="text-xs font-bold">Estado Realtime</p>
                                    <p className="text-[10px] text-muted-foreground">Actualizado automáticamente</p>
                                </div>
                            </div>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        </div>

                        <Button className="w-full h-14 rounded-2xl font-bold bg-foreground text-background hover:bg-foreground/90">
                            Invitar Amigos
                        </Button>

                        <p className="text-center text-[10px] text-muted-foreground font-medium uppercase tracking-widest pt-2">
                            Presenta este ticket al llegar
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-5 rounded-[2rem] space-y-3">
                <h4 className="font-bold text-amber-900 flex items-center gap-2">
                    <Clock3 className="w-4 h-4" /> Notas de llegada
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                    Recuerda llegar puntual. Las mesas se liberan después de 15 minutos de retraso. Si no asistes, tu reputación bajará automáticamente.
                </p>
            </div>
        </div>
    );
}
