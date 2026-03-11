"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';
import { Bell } from 'lucide-react';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
    resource_id?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(30);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
    };

    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        // Realtime subscription to NOTIFICATIONS table
        const notificationsChannel = supabase
            .channel(`user-notifications-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const newNotification = payload.new as Notification;
                    setNotifications(prev => [newNotification, ...prev].slice(0, 30));
                    setUnreadCount(prev => prev + 1);

                    toast.success(`${newNotification.title}\n${newNotification.message}`, {
                        duration: 5000,
                    });

                    try {
                        const audio = new Audio('/notification.mp3');
                        audio.play().catch(() => { });
                    } catch (e) { }
                }
            )
            .subscribe();

        // Realtime subscription to TAKEAWAY ORDERS table
        const ordersChannel = supabase
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
                    const status = payload.new.status?.toUpperCase();
                    const prevStatus = payload.old?.status?.toUpperCase();
                    if (status !== prevStatus) {
                        if (status === 'APROBADA') {
                            toast.success(`Tu pedido ha sido aprobado`, { icon: '✅' });
                        } else if (status === 'PREPARANDO') {
                            toast('Tu pedido está siendo preparado', { icon: '🧑‍🍳' });
                        } else if (status === 'LISTO') {
                            toast.success(`Tu pedido está listo para retirar en el local`, { duration: 6000, icon: '🥡' });
                            try {
                                const audio = new Audio('/notification.mp3');
                                audio.play().catch(() => { });
                            } catch (e) { }
                        } else if (status === 'ENTREGADO' || status === 'COMPLETADO') {
                            toast.success(`¡Pedido entregado! Disfrútalo`);
                        }
                    }
                }
            )
            .subscribe();

        // Realtime subscription to RESERVATIONS table
        const reservationsChannel = supabase
            .channel(`user-reservations-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'reservations',
                    filter: `organizer_id=eq.${user.id}`
                },
                (payload) => {
                    const status = payload.new.status?.toUpperCase();
                    const prevStatus = payload.old?.status?.toUpperCase();
                    if (status !== prevStatus) {
                        if (status === 'APROBADA' || status === 'CONFIRMADA') {
                            toast.success(`¡Tu reserva ha sido confirmada!`, { icon: '📅' });
                            try {
                                const audio = new Audio('/notification.mp3');
                                audio.play().catch(() => { });
                            } catch (e) { }
                        } else if (status === 'RECHAZADA' || status === 'CANCELADA') {
                            toast.error(`Tu reserva fue cancelada o rechazada`);
                        } else if (status === 'SENTADO' || status === 'SEATED') {
                            toast.success(`¡Disfruta tu experiencia!`);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(notificationsChannel);
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(reservationsChannel);
        };
    }, [user]);

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (!error) {
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
