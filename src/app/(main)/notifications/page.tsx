"use client";

import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { ArrowLeft, Bell, BellRing, Smartphone, Mail, MessageSquare, Trash2, CheckCircle, ShoppingBag, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

export default function NotificationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [view, setView] = useState<'list' | 'settings'>('list');

    if (!user) return null;

    return (
        <div className="w-full min-h-screen bg-slate-50 pb-24">
            <header className="sticky top-0 bg-white/80 backdrop-blur-xl z-50 border-b border-slate-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-2xl bg-slate-100/50 hover:bg-slate-100">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">Notificaciones</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {view === 'list' ? 'Alertas Recibidas' : 'Canales y Alertas'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setView(view === 'list' ? 'settings' : 'list')}
                        className="rounded-xl font-bold text-xs"
                    >
                        {view === 'list' ? 'Ajustes' : 'Ver Lista'}
                    </Button>
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-6">
                {view === 'list' ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recientes</span>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-black uppercase text-primary hover:underline"
                                >
                                    Marcar todo como leído
                                </button>
                            )}
                        </div>

                        {notifications.length === 0 ? (
                            <div className="bg-white rounded-[2.5rem] p-12 text-center space-y-4 border border-slate-100 shadow-sm">
                                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto">
                                    <Bell className="w-10 h-10 text-slate-200" />
                                </div>
                                <p className="text-slate-400 font-bold text-sm">No tienes notificaciones aún</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {notifications.map((n) => (
                                    <NotificationCard
                                        key={n.id}
                                        notification={n}
                                        onMarkRead={() => markAsRead(n.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <NotificationSettings />
                )}
            </main>
        </div>
    );
}

function NotificationCard({ notification, onMarkRead }: { notification: any, onMarkRead: () => void }) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'order': return <ShoppingBag className="w-5 h-5" />;
            case 'reservation': return <Calendar className="w-5 h-5" />;
            default: return <BellRing className="w-5 h-5" />;
        }
    };

    const getLink = (type: string, resourceId: string) => {
        if (!resourceId) return '#';
        switch (type) {
            case 'order': return `/orders/${resourceId}`;
            case 'reservation': return `/reservations/${resourceId}`;
            default: return '#';
        }
    };

    return (
        <div
            onClick={onMarkRead}
            className={`group relative p-5 bg-white border rounded-[2rem] transition-all shadow-sm active:scale-[0.98] ${notification.is_read ? 'opacity-70 border-slate-100' : 'border-primary/20 bg-primary/[0.02]'}`}
        >
            <Link href={getLink(notification.type, notification.resource_id)} className="flex gap-4">
                <div className={`p-3 rounded-2xl flex items-center justify-center h-12 w-12 shrink-0 ${notification.is_read ? 'bg-slate-100 text-slate-400' : 'bg-primary/10 text-primary animate-pulse'}`}>
                    {getIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-1 pr-2">
                    <div className="flex justify-between items-start">
                        <h4 className="font-black text-sm text-slate-800 tracking-tight leading-tight">
                            {notification.title}
                        </h4>
                        {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full mt-1 shrink-0" />
                        )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{notification.message}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-1">
                        {format(new Date(notification.created_at), "d 'de' MMM, HH:mm", { locale: es })}
                    </p>
                </div>
            </Link>
        </div>
    );
}

function NotificationSettings() {
    // This is a simplified version of the previous settings page content
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[2.5rem] p-8 space-y-4 border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Canales de Alerta</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                    Estamos trabajando para integrar más canales de comunicación. Por ahora, todas las alertas se registran en tu cuenta Almuerzo.cl.
                </p>

                <div className="pt-4 space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-slate-400" />
                            <span className="text-sm font-bold text-slate-600">Push Mobile</span>
                        </div>
                        <span className="text-[8px] font-black bg-slate-200 px-2 py-1 rounded text-slate-500 uppercase">Configurado</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-slate-400" />
                            <span className="text-sm font-bold text-slate-600">Email</span>
                        </div>
                        <span className="text-[8px] font-black bg-emerald-100 px-2 py-1 rounded text-emerald-600 uppercase">Activo</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
