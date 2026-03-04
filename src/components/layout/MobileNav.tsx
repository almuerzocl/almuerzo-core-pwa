"use client";

import { Home, Heart, CalendarRange, ShoppingBag, Search, UserCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileNav() {
    const pathname = usePathname();

    const navItems = [
        { name: "Home", href: "/", icon: Home },
        { name: "Mis reservas", href: "/reservations", icon: CalendarRange },
        { name: "Mis pedidos", href: "/orders", icon: ShoppingBag },
        { name: "Perfil", href: "/profile", icon: UserCircle }, // Replaced Search with Profile, or kept Search?
    ];

    return (
        <div className="fixed bottom-0 left-0 z-[20000] w-full h-[68px] sm:h-16 bg-background/95 backdrop-blur border-t border-border pb-safe">
            <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`inline-flex flex-col items-center justify-center hover:bg-muted group ${isActive ? "text-primary" : "text-muted-foreground"
                                } `}
                        >
                            <Icon
                                className={`w-[22px] h-[22px] mb-1 ${isActive ? "text-primary fill-primary/10" : "text-muted-foreground group-hover:text-primary/80"
                                    } `}
                            />
                            <span
                                className={`text-[9.5px] tracking-tight ${isActive ? "text-primary font-bold" : "text-muted-foreground font-medium group-hover:text-primary/80"
                                    } `}
                            >
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
