"use client";

import { ShoppingBag, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationSelector } from "./LocationSelector";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useNotifications } from "@/context/NotificationContext";
import { getInitials } from "@/lib/core-business/ui-helpers";
import Link from "next/link";

export function TopHeader() {
    const { user, profile } = useAuth();
    const { itemCount } = useCart();
    const { unreadCount } = useNotifications();

    const initials = getInitials(profile?.first_name || user?.email?.split('@')[0], profile?.last_name);

    return (
        <header className="sticky top-0 z-[10000] w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center px-4 md:px-6 w-full max-w-7xl mx-auto gap-4">

                {/* Ubicación (Selector Contextual) */}
                <LocationSelector />

                {/* Acciones del Header */}
                <div className="flex items-center gap-2">
                    <Link href="/notifications">
                        <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 bg-muted/30 relative">
                            <Bell className="w-5 h-5 text-foreground/80" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in">
                                    {unreadCount}
                                </span>
                            )}
                        </Button>
                    </Link>

                    <Link href="/cart">
                        <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 bg-muted/30 relative">
                            <ShoppingBag className="w-5 h-5 text-foreground/80" />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in">
                                    {itemCount}
                                </span>
                            )}
                        </Button>
                    </Link>

                    <Link href="/profile">
                        <div className="h-9 w-9 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                            {profile?.photo_url ? (
                                <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-primary">{initials}</span>
                            )}
                        </div>
                    </Link>
                </div>

            </div>
        </header>
    );
}
