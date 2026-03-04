"use client";

import { useAuth } from "@/context/AuthContext";
import { User, Settings, Shield, Bell, CreditCard, LogOut, ChevronRight, UserCircle, Star, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
    const { user, profile, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
    };

    const initials = profile?.first_name
        ? `${profile.first_name.charAt(0)}${profile.last_name?.charAt(0) || ""}`.toUpperCase()
        : user?.email?.charAt(0).toUpperCase() || "U";

    const menuItems = [
        { label: "Mi Información", icon: UserCircle, desc: "Gestiona tus datos personales", href: "/profile/info" },
        { label: "Favoritos y Suscripciones", icon: Star, desc: "Guardados y menús diarios", href: "/favorites" },
        { label: "Clubes de Descuentos", icon: Award, desc: "Mis beneficios e instituciones", href: "/subscriptions" },
        { label: "Notificaciones", icon: Bell, desc: "Configura tus alertas", href: "/notifications" },
        { label: "Agenda de Contactos", icon: UserCircle, desc: "Mis invitados y ley de contactos", href: "/profile/contacts" },
        { label: "Seguridad", icon: Shield, desc: "Contraseña y accesos", href: "/security" },
    ];

    return (
        <div className="w-full max-w-lg mx-auto p-4 space-y-8 pb-24">
            {/* Header / Hero */}
            <div className="flex flex-col items-center text-center space-y-4 pt-6">
                <div className="h-24 w-24 rounded-full bg-primary/10 border-4 border-background shadow-xl flex items-center justify-center relative overflow-hidden ring-2 ring-primary/20">
                    {profile?.photo_url ? (
                        <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-3xl font-black text-primary">{initials}</span>
                    )}
                </div>
                <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight text-foreground">
                        {profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}` : "Usuario Almuerzo"}
                    </h2>
                    <p className="text-sm text-muted-foreground font-medium">{user?.email}</p>
                </div>

                {/* Reputation Badges */}
                <div className="flex gap-2 pt-2 flex-wrap justify-center">

                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full border border-green-200 flex items-center gap-1">
                        Reputación Reservas: {profile?.reservation_reputation || 0}%
                    </span>
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1">
                        Reputación Pedidos: {profile?.takeaway_reputation || 0}%
                    </span>
                </div>
            </div>

            {/* Menu List */}
            <div className="space-y-3">
                {menuItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={idx}
                            href={item.href || '#'}
                            className="w-full p-4 flex items-center justify-between bg-card border border-border rounded-3xl hover:border-primary/30 hover:shadow-md transition-all group active:scale-[0.99]"
                        >
                            <div className="flex items-center gap-4 text-left">
                                <div className="bg-muted p-2.5 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground group-hover:text-primary transition-colors">{item.label}</p>
                                    <p className="text-[11px] text-muted-foreground font-medium">{item.desc}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </Link>
                    );
                })}
            </div>

            {/* Sign Out Section */}
            <div className="pt-4">
                <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full h-14 rounded-2xl text-destructive hover:text-destructive hover:bg-destructive/5 font-bold gap-3 border border-transparent hover:border-destructive/20"
                >
                    <LogOut className="w-5 h-5" />
                    Cerrar Sesión
                </Button>
            </div>

            <p className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-40">
                Almuerzo Cloud Core V5.0.1
            </p>
        </div>
    );
}
