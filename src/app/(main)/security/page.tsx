"use client";

import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, ShieldCheck, Key, LogOut, Loader2, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SecurityPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [passwords, setPasswords] = useState({
        new: '',
        confirm: ''
    });

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            toast.error("Las contraseñas no coinciden");
            return;
        }
        if (passwords.new.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwords.new
            });

            if (error) throw error;

            toast.success("Contraseña actualizada con éxito");
            setPasswords({ new: '', confirm: '' });
        } catch (error: any) {
            toast.error(error.message || "Error al actualizar contraseña");
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
    };

    if (!user) return null;

    return (
        <div className="w-full min-h-screen bg-slate-50 pb-24">
            <header className="sticky top-0 bg-white/80 backdrop-blur-xl z-50 border-b border-slate-100 p-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-2xl bg-slate-100/50 hover:bg-slate-100 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Button>
                <div>
                    <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">Seguridad</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Protección de Cuenta</p>
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-6">
                {/* Security Status Card */}
                <div className="bg-white rounded-[2.5rem] p-8 text-center space-y-4 border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner relative">
                        <ShieldCheck className="w-10 h-10 text-emerald-600 opacity-60" />
                        <div className="absolute -top-1 -right-1 bg-white p-1 rounded-full shadow-sm">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Cuenta Protegida</h3>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-[240px] mx-auto">
                            Tu información está cifrada y protegida por los estándares de seguridad de Supabase Auth.
                        </p>
                    </div>
                </div>

                {/* Change Password Form */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6">
                    <div className="flex items-center gap-3 mb-2 px-1">
                        <div className="bg-primary/10 p-2 rounded-xl text-primary">
                            <Key className="w-5 h-5" />
                        </div>
                        <h3 className="font-black text-slate-800 tracking-tight">Actualizar Contraseña</h3>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Nueva Contraseña</Label>
                            <Input
                                type="password"
                                value={passwords.new}
                                onChange={(e) => setPasswords(s => ({ ...s, new: e.target.value }))}
                                className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 font-bold transition-all"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirmar Contraseña</Label>
                            <Input
                                type="password"
                                value={passwords.confirm}
                                onChange={(e) => setPasswords(s => ({ ...s, confirm: e.target.value }))}
                                className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 font-bold transition-all"
                                placeholder="Repite la contraseña"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading || !passwords.new}
                            className="w-full h-14 rounded-2xl font-black bg-primary hover:bg-primary/95 shadow-lg shadow-primary/20 transition-all active:scale-95 mt-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Actualizar Acceso"}
                        </Button>
                    </form>
                </div>

                {/* Sessions Section */}
                <div className="bg-rose-50/50 border border-rose-100 rounded-[2rem] p-6 space-y-4">
                    <div className="space-y-1">
                        <h3 className="font-black text-rose-800 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Sesiones Activas
                        </h3>
                        <p className="text-[11px] text-rose-600/70 font-bold uppercase tracking-wider">¿Dispositivo compartido?</p>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full h-14 rounded-2xl font-black gap-3 text-rose-600 hover:bg-rose-100/50 border border-rose-200/50"
                        onClick={handleSignOut}
                    >
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión Global
                    </Button>
                    <p className="text-[10px] text-center text-rose-400 font-bold uppercase tracking-widest">
                        Al cerrar sesión se perderá el acceso en este navegador.
                    </p>
                </div>
            </main>
        </div>
    );
}
