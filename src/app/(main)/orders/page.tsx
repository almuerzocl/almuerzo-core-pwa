"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { ShoppingBag, MapPin, Clock, UtensilsCrossed, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBusinessStatusStyles, formatCurrency } from "@/lib/core-business/ui-helpers";

export default function OrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    const fetchOrders = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from("takeaway_orders")
                .select(`
                    *,
                    restaurant:restaurants(name, address, id)
                `)
                .eq("user_id", user?.id)
                .order("created_at", { ascending: true });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        fetchOrders();

        // Realtime Subscription for user's orders
        const channel = supabase
            .channel(`user-orders-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'takeaway_orders',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Order status update:', payload);
                    fetchOrders();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // Local getStatusColor removed - Now using centralized Business UI Skill

    const activeStatuses = ['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'LISTO', 'PAGADO'];
    const activeOrders = orders.filter((o: any) => activeStatuses.includes(o.status?.toUpperCase() || 'PENDIENTE'));
    const historyOrders = orders.filter((o: any) => !activeStatuses.includes(o.status?.toUpperCase() || 'PENDIENTE'));

    return (
        <div className="w-full max-w-lg mx-auto p-4 space-y-6 pb-24">
            <header className="space-y-1">
                <h1 className="text-2xl font-black tracking-tight text-foreground">Mis Pedidos</h1>
                <p className="text-sm text-muted-foreground">Revisa tus pedidos para llevar (takeaway).</p>
            </header>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-muted/50 animate-pulse rounded-3xl" />
                    ))}
                </div>
            ) : orders.length > 0 ? (
                <div className="space-y-4">
                    {activeOrders.length > 0 ? (
                        activeOrders.map((order: any) => (
                            <div key={order.id}>
                                <OrderCard order={order} />
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center bg-muted/30 rounded-3xl border border-dashed border-border">
                            <p className="text-sm text-muted-foreground">No tienes pedidos activos.</p>
                        </div>
                    )}

                    {historyOrders.length > 0 && (
                        <div className="pt-6 border-t border-border mt-6">
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-2xl hover:bg-muted transition-colors font-bold text-foreground"
                            >
                                <span className="flex items-center gap-2">
                                    <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                                    Historial de Pedidos
                                </span>
                                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${showHistory ? 'rotate-180' : ''}`} />
                            </button>

                            {showHistory && (
                                <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                    {historyOrders.map((order: any) => (
                                        <div key={order.id}>
                                            <OrderCard order={order} isHistory />
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
                        <ShoppingBag className="w-10 h-10 text-primary/40" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-bold text-xl">¿Tienes hambre?</h3>
                        <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                            Tus pedidos para llevar aparecerán aquí para que hagas seguimiento.
                        </p>
                    </div>
                    <Link href="/">
                        <Button className="rounded-2xl h-12 px-8 font-bold">Pedir Algo Rico</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}

function OrderCard({ order, isHistory = false }: { order: any, isHistory?: boolean }) {
    const router = useRouter();
    const status = (order.status || 'PENDIENTE').toUpperCase();
    const orderUrl = `/orders/${order.id}`;

    return (
        <div className={`space-y-2 ${isHistory ? 'opacity-80 grayscale-[0.2]' : ''}`}>
            {/* Clickable Card Container */}
            <div
                onClick={() => router.push(orderUrl)}
                className={`cursor-pointer block group bg-card border border-border rounded-3xl p-5 hover:shadow-lg hover:border-primary/20 transition-all space-y-4 relative overflow-hidden active:scale-[0.98] ${isHistory ? 'bg-muted/10' : ''}`}
            >
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                            {order.restaurant?.name || "Restaurante"}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">
                                {typeof order.restaurant?.address === 'object' && order.restaurant?.address !== null
                                    ? `${order.restaurant.address.street || ''} ${order.restaurant.address.number || ''}`.trim()
                                    : (order.restaurant?.address || "Dirección no disponible")}
                            </span>
                        </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getBusinessStatusStyles(order.status)}`}>
                        {order.status || 'PENDIENTE'}
                    </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Monto Total</span>
                        <span className="font-extrabold text-foreground text-lg">
                            {formatCurrency(order.total_amount)}
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Fecha</span>
                        <span className="text-xs font-semibold text-foreground/80">
                            {format(new Date(order.created_at), "d 'de' MMM, HH:mm", { locale: es })}
                        </span>
                    </div>
                </div>
            </div>

            {/* External Action Buttons */}
            {!isHistory && status === 'LISTO' && (
                <div className="pt-1">
                    <Button
                        onClick={() => router.push(`${orderUrl}?action=pickup`)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold py-6 shadow-lg shadow-blue-500/20 uppercase tracking-widest text-[11px]"
                    >
                        Validar Retiro (Avisar Llegada)
                    </Button>
                </div>
            )}
        </div>
    );
}
