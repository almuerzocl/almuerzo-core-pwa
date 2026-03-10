"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, Plus, Store, Clock, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/core-business/ui-helpers";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function RestaurantMenuPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { addToCart, itemCount } = useCart();

    const [restaurant, setRestaurant] = useState<any>(null);
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMenuAndRestaurant = async () => {
            setLoading(true);
            try {
                const { data: resData } = await supabase.from('restaurants').select('*').eq('id', id).single();
                setRestaurant(resData);

                const { data: menuData } = await supabase
                    .from('menu_items')
                    .select('*')
                    .eq('restaurant_id', id)
                    .eq('is_available', true);

                setMenuItems(menuData || []);
            } catch (error) {
                console.error("Error fetching menu:", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchMenuAndRestaurant();
    }, [id]);

    const handleAddToCart = (item: any) => {
        if (!restaurant) return;

        addToCart({
            id: item.id,
            name: item.name,
            price: item.takeaway_price || item.price || 0,
            quantity: 1,
            restaurantId: restaurant.id,
            restaurantName: restaurant.name
        });
    };

    if (loading) {
        return (
            <div className="w-full h-full max-w-lg mx-auto bg-background min-h-screen">
                <div className="p-4 space-y-4 pt-10">
                    <Skeleton className="h-10 w-3/4 rounded-xl" />
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-28 w-full rounded-3xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!restaurant) {
        return <div className="text-center pt-24 font-bold text-muted-foreground">Restaurante no encontrado</div>;
    }

    return (
        <div className="w-full h-full max-w-lg mx-auto pb-32 bg-slate-50 min-h-screen">
            {/* Header Sticky */}
            <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 flex flex-col shadow-sm">
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-slate-100 h-10 w-10">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-black tracking-tight leading-none">{restaurant.name}</h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <Clock className="w-3 h-3 text-emerald-600" />
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Disponible para hoy</span>
                            </div>
                        </div>
                    </div>
                    <Badge variant="outline" className="rounded-full border-blue-100 bg-blue-50 text-blue-700 font-bold px-3 py-1">
                        TAKEAWAY
                    </Badge>
                </div>
            </div>

            <div className="p-4 space-y-6 mt-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Platos Disponibles</h2>
                    <Badge variant="secondary" className="bg-slate-200/50 text-slate-600 font-bold">
                        {menuItems.length} opciones
                    </Badge>
                </div>

                {menuItems.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {menuItems.map(item => (
                            <div
                                key={item.id}
                                className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group overflow-hidden relative"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 pr-4 space-y-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black text-lg text-slate-900 leading-tight uppercase tracking-tight">{item.name}</h3>
                                                {item.is_menu_del_dia && (
                                                    <Badge className="bg-orange-500 text-white border-none p-1 rounded-full">
                                                        <Store className="w-3 h-3" />
                                                    </Badge>
                                                )}
                                                {item.category && (
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.category}</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-2">
                                                {item.description || "Un delicioso plato artesanal preparado por nuestros mejores chefs para disfrutar donde quieras."}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 pt-2">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Precio</span>
                                                <span className="text-xl font-black text-primary">
                                                    {formatCurrency(item.takeaway_price || item.price || 0)}
                                                </span>
                                            </div>
                                            {item.takeaway_price && item.takeaway_price < item.price && (
                                                <div className="flex flex-col opacity-50">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest line-through">Local</span>
                                                    <span className="text-xs font-bold text-slate-400 line-through">
                                                        {formatCurrency(item.price)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        size="icon"
                                        className="rounded-3xl h-14 w-14 shrink-0 bg-primary shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all text-white"
                                        onClick={() => handleAddToCart(item)}
                                    >
                                        <Plus className="w-6 h-6 stroke-[3]" />
                                    </Button>
                                </div>

                                {/* Micro-animation detail */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:-mr-8 group-hover:-mt-8" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 px-6 bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-inner space-y-6">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto ring-4 ring-slate-50/50">
                            <ShoppingBag className="w-12 h-12 text-slate-300" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Menú no detallado</h3>
                            <p className="text-sm text-slate-500 font-medium max-w-[240px] mx-auto italic">
                                Este restaurante aún no ha subido sus platos disponibles para retiro.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="rounded-2xl h-12 font-black uppercase text-xs tracking-widest"
                            onClick={() => router.back()}
                        >
                            Ver otros locales
                        </Button>
                    </div>
                )}
            </div>

            {/* Float Cart Bar */}
            {itemCount > 0 && (
                <div className="fixed bottom-8 left-0 right-0 px-6 z-[60] animate-in slide-in-from-bottom duration-500">
                    <div className="w-full max-w-lg mx-auto">
                        <Button
                            className="w-full h-16 bg-slate-900 text-white rounded-3xl font-black text-lg shadow-2xl flex items-center justify-between px-8 border-2 border-white/10 hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-95"
                            onClick={() => router.push('/cart')}
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-primary p-2 rounded-xl">
                                    <ShoppingBag className="w-5 h-5 text-white" />
                                </div>
                                <span className="uppercase tracking-tight">Tu Pedido ({itemCount})</span>
                            </div>
                            <ChevronRight className="w-6 h-6" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
