"use client";

import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, UserCircle, Edit3, Loader2, Camera, Mail, Phone, Calendar, MapPin } from "lucide-react";
import { getInitials } from "@/lib/core-business/ui-helpers";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressAutocomplete } from "@/components/ui/AddressAutocomplete";

export default function ProfileInfoPage() {
    const { user, profile } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        display_name: '',
        phone: '',
        default_address: '',
        default_address_lat: null as number | null,
        default_address_lng: null as number | null
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                display_name: profile.display_name || '',
                phone: profile.phone || profile.phone_number || '',
                default_address: profile.default_address || '',
                default_address_lat: profile.default_address_lat || null,
                default_address_lng: profile.default_address_lng || null
            });
        }
    }, [profile]);

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    display_name: formData.display_name,
                    phone: formData.phone,
                    phone_number: formData.phone, // Syncing both for compatibility
                    default_address: formData.default_address,
                    default_address_lat: formData.default_address_lat,
                    default_address_lng: formData.default_address_lng
                })
                .eq('id', user.id);

            if (error) throw error;

            toast.success("Información actualizada");
            // Reload page to reflect changes if context doesn't auto-update
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar");
        } finally {
            setLoading(false);
        }
    };

    if (!user || !profile) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    const initials = getInitials(profile?.first_name || user?.email?.split('@')[0], profile?.last_name);

    return (
        <div className="w-full min-h-screen bg-slate-50 pb-24">
            {/* Header Sticky */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-xl z-50 border-b border-slate-100 p-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-2xl bg-slate-100/50 hover:bg-slate-100 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Button>
                <div>
                    <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">Mi Información</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Perfil de Usuario</p>
                </div>
            </header>

            <div className="max-w-md mx-auto p-6 space-y-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative group">
                        <div className="h-28 w-28 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-2xl shadow-primary/10 border-4 border-white overflow-hidden ring-4 ring-primary/5">
                            {profile.photo_url ? (
                                <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-black text-primary">{initials}</span>
                            )}
                        </div>
                        <button className="absolute -bottom-2 -right-2 bg-white p-2.5 rounded-2xl shadow-lg border border-slate-100 text-primary hover:scale-110 transition-transform active:scale-95">
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Form Sections */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="display_name" className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                    <Edit3 className="w-3 h-3" />
                                    Nombre Público (Alias)
                                </Label>
                                <Input
                                    id="display_name"
                                    value={formData.display_name}
                                    onChange={(e) => setFormData(s => ({ ...s, display_name: e.target.value }))}
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 font-bold transition-all"
                                    placeholder="Ej: Juan Gourmet"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name" className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre</Label>
                                    <Input
                                        id="first_name"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData(s => ({ ...s, first_name: e.target.value }))}
                                        className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 font-bold transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name" className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Apellido</Label>
                                    <Input
                                        id="last_name"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData(s => ({ ...s, last_name: e.target.value }))}
                                        className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 font-bold transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                    <Mail className="w-3 h-3" />
                                    Correo Electrónico
                                </Label>
                                <div className="h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center px-4 font-bold text-slate-400 gap-3 group relative">
                                    {user.email}
                                    <div className="ml-auto bg-slate-200/50 text-[9px] px-2 py-0.5 rounded-full">LECTURA</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                    <Phone className="w-3 h-3" />
                                    Nº Celular
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(s => ({ ...s, phone: e.target.value }))}
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 font-bold transition-all"
                                    placeholder="+569 1234 5678"
                                />
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                    <MapPin className="w-3 h-3" />
                                    Dirección Principal
                                </Label>
                                <AddressAutocomplete
                                    onAddressSelect={(addr) => setFormData(s => ({
                                        ...s,
                                        default_address: addr.address,
                                        default_address_lat: addr.lat,
                                        default_address_lng: addr.lng
                                    }))}
                                    defaultValue={formData.default_address}
                                    placeholder="Tu dirección en Santiago..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full h-16 rounded-[1.5rem] text-lg font-black shadow-xl shadow-primary/20 bg-primary hover:bg-primary/95 transition-all active:scale-95"
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                "Guardar Cambios"
                            )}
                        </Button>
                    </div>

                    <div className="text-center space-y-2">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                            Miembro desde {profile.created_at ? new Date(profile.created_at).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }) : '---'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
