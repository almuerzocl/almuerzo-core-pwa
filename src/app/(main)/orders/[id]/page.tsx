"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/core-business/ui-helpers";
import { ArrowLeft, MapPin, ShoppingBag, Clock, ChevronRight, CheckCircle2, Package, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchOrder();
            subscribeToChanges();
        }
    }, [params.id]);

    const fetchOrder = async () => {
        try {
            const { data, error } = await supabase
                .from("takeaway_orders")
                .select(`
                    *,
                    restaurant:restaurants(name, address, id, logo_url)
                `)
                .eq("id", params.id)
                .single();

            if (error) throw error;
            setOrder(data);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToChanges = () => {
        const channel = supabase
            .channel(`order-${params.id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'takeaway_orders', filter: `id=eq.${params.id}` },
                (payload) => {
                    setOrder((prev: any) => ({ ...prev, ...payload.new }));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Cargando pedido...</div>;
    if (!order) return <div className="p-8 text-center">No se encontró el pedido.</div>;

    const steps = [
        { label: "Recibido", status: "PENDIENTE", icon: Clock },
        { label: "Preparando", status: "PREPARANDO", icon: UtensilsCrossed },
        { label: "Listo", status: "LISTO", icon: Package },
        { label: "Entregado", status: "COMPLETADO", icon: CheckCircle2 },
    ];

    const currentStepIdx = steps.findIndex(s => s.status === order.status);

    return (
        <div className="w-full max-w-lg mx-auto p-4 space-y-6 pb-24">
            <header className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-black tracking-tight">Detalle del Pedido</h1>
            </header>

            {/* Status Tracking */}
            <div className="bg-card border border-border rounded-3xl p-6 space-y-8 shadow-sm">
                <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado Actual</p>
                        <p className="text-2xl font-black text-primary">{order.status}</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                </div>

                <div className="relative flex justify-between items-start">
                    {/* Line behind steps */}
                    <div className="absolute top-5 left-4 right-4 h-0.5 bg-muted" />
                    <div
                        className="absolute top-5 left-4 h-0.5 bg-primary transition-all duration-500"
                        style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
                    />

                    {steps.map((step, idx) => {
                        const Icon = step.icon;
                        const isCompleted = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;

                        return (
                            <div key={idx} className="flex flex-col items-center gap-2 relative z-10 w-1/4">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center border-4 border-background transition-colors ${isCompleted ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                                    } ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <span className={`text-[10px] font-bold text-center ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Order Items */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-border/50 bg-muted/20">
                    <h3 className="font-bold text-sm">Resumen del Pedido</h3>
                </div>
                <div className="divide-y divide-border/50">
                    {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="p-5 flex justify-between items-center">
                            <div className="space-y-0.5">
                                <p className="font-bold text-sm">{item.name}</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase">Cant: {item.quantity}</p>
                            </div>
                            <p className="font-extrabold text-foreground">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                    ))}
                </div>
                <div className="p-5 bg-primary/5 flex justify-between items-center">
                    <span className="font-bold text-sm">Total pagado</span>
                    <span className="text-xl font-black text-primary">{formatCurrency(order.total_amount)}</span>
                </div>
            </div>

            {/* Restaurant Info */}
            <div className="bg-card border border-border rounded-3xl p-5 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-muted rounded-2xl overflow-hidden shrink-0">
                    {order.restaurant?.logo_url && <img src={order.restaurant.logo_url} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{order.restaurant?.name}</h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                            {typeof order.restaurant?.address === 'object' && order.restaurant?.address !== null
                                ? `${order.restaurant.address.street || ''} ${order.restaurant.address.number || ''}`.trim()
                                : (order.restaurant?.address || "Dirección no disponible")}
                        </span>
                    </div>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs h-9">
                    Llamar
                </Button>
            </div>

            <Button onClick={() => router.push('/')} variant="ghost" className="w-full h-14 rounded-2xl font-bold text-muted-foreground hover:text-foreground">
                Volver al Inicio
            </Button>
        </div>
    );
}
