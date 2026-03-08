"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CheckoutEngine } from "@/lib/core-business/checkout-engine";
import { BlockingToast } from "@/components/blocks/BlockingToast";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { toZonedTime } from "date-fns-tz";

export default function CartPage() {
    const { items, removeFromCart, updateQuantity, total, itemCount, clearCart } = useCart();
    const { user, profile } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [toastConfig, setToastConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "loading" as "loading" | "success" | "error"
    });

    const handleCheckout = async () => {
        if (!user || !profile) {
            toast.error("Debes iniciar sesión para realizar un pedido");
            return;
        }

        if (items.length === 0) return;

        setIsLoading(true);
        setToastConfig({
            isOpen: true,
            title: "Procesando Pedido",
            message: "Estamos validando tu carrito y beneficios de cuenta...",
            type: "loading"
        });

        try {
            // 1. Motor de Negocio: Preparar datos
            const sessionInfo = CheckoutEngine.prepareSessionData(profile);

            // 2. Motor de Negocio: Calcular reputación
            const dailyReputation = await CheckoutEngine.calculateDailyReputation(user.id);

            // 3. Motor de Negocio: Beneficios de Cuenta
            const restaurantId = items[0].restaurantId;
            const benefits = CheckoutEngine.applyAccountBenefits({ user: profile, restaurantId });

            // 4. Insert order with ALL snapshots (Critical for V5)
            const { data: order, error } = await supabase
                .from("takeaway_orders")
                .insert({
                    user_id: user.id,
                    restaurant_id: restaurantId,
                    items: items,
                    total_amount: total,
                    status: "PENDIENTE",
                    customer_name: sessionInfo.fullName,
                    customer_phone: sessionInfo.contactPhone,
                    user_reputation_snapshot: dailyReputation.score,
                    account_type_snapshot: profile.account_type,
                    benefits_snapshot: benefits,
                    metadata: {
                        source: 'pwa-v5',
                        reputation_level: dailyReputation.level
                    }
                })
                .select()
                .single();

            if (error) throw error;

            setToastConfig({
                isOpen: true,
                title: "¡Pedido Recibido!",
                message: "Tu pedido ha sido enviado al restaurante. Revisa la sección 'Mis Pedidos' para ver el estado.",
                type: "success"
            });

            // Trigger Notifications in background (fire and forget)
            // Use ISO string to avoid parsing errors in notifications lib
            import("@/lib/notifications").then(({ sendTakeawayOrderNotifications }) => {
                sendTakeawayOrderNotifications({
                    id: order.id,
                    restaurantId: restaurantId,
                    restaurantName: items[0].restaurantName || 'Almuerzo.cl',
                    dateTime: toZonedTime(new Date(), 'America/Santiago').toISOString(),
                    itemCount: itemCount,
                    guestName: sessionInfo.fullName,
                    guestEmail: user.email || '',
                    guestPhone: sessionInfo.contactPhone
                }).catch(err => console.error("Notification background error:", err));
            });

            // Clear cart after success
            clearCart();

            // Wait a bit so they see the success toast before redirecting
            setTimeout(() => {
                router.push("/orders");
            }, 2500);

        } catch (err: any) {
            console.error("Checkout error:", err);
            setToastConfig({
                isOpen: true,
                title: "Error en el Pedido",
                message: err.message || "No pudimos procesar tu pedido. Intenta nuevamente.",
                type: "error"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto p-4 space-y-6 pb-24">
            <header className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-black tracking-tight text-foreground">Tu Pedido</h1>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{itemCount} Items seleccionados</p>
                </div>
            </header>

            {items.length > 0 ? (
                <>
                    <div className="space-y-3">
                        {items.map((item) => (
                            <div key={item.id} className="bg-card border border-border rounded-3xl p-4 flex gap-4 items-center">
                                <div className="w-20 h-20 bg-muted rounded-2xl overflow-hidden shrink-0">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                            <ShoppingBag className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="font-bold text-sm truncate">{item.name}</h3>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">{item.restaurantName}</p>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="font-extrabold text-primary text-base">
                                            ${(item.price * item.quantity).toLocaleString('es-CL')}
                                        </span>
                                        <div className="flex items-center bg-muted/50 rounded-xl p-1 gap-2">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-background border border-border/50 shadow-sm active:scale-90 transition-transform"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-xs font-black min-w-[20px] text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white shadow-sm active:scale-90 transition-transform"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-primary/5 rounded-[2.5rem] p-6 space-y-4 border border-primary/10">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-muted-foreground">Subtotal</span>
                            <span className="font-bold text-foreground">${total.toLocaleString('es-CL')}</span>
                        </div>
                        <div className="pt-4 border-t border-primary/10 flex justify-between items-center">
                            <div className="space-y-1">
                                <span className="text-lg font-black text-foreground block">Total a pagar</span>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none block">
                                    Pago y retiro presencial
                                </span>
                            </div>
                            <span className="text-2xl font-black text-primary">
                                ${total.toLocaleString('es-CL')}
                            </span>
                        </div>
                    </div>

                    <Button
                        onClick={handleCheckout}
                        disabled={isLoading}
                        className="w-full h-16 rounded-3xl font-black text-lg gap-3 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                        Confirmar Pedido
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </>
            ) : (
                <div className="py-20 text-center space-y-6">
                    <div className="bg-muted w-24 h-24 rounded-full flex items-center justify-center mx-auto">
                        <ShoppingBag className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-bold text-xl">Tu carro está vacío</h3>
                        <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                            Agrega platos de tus restaurantes favoritos para empezar.
                        </p>
                    </div>
                    <Link href="/">
                        <Button variant="outline" className="rounded-2xl h-12 px-8 font-bold border-primary text-primary hover:bg-primary/5 transition-colors">
                            Ver Restaurantes
                        </Button>
                    </Link>
                </div>
            )}

            <BlockingToast
                isOpen={toastConfig.isOpen}
                title={toastConfig.title}
                message={toastConfig.message}
                type={toastConfig.type}
                onClose={() => setToastConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}

