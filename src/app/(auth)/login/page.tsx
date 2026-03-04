"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mode, setMode] = useState<"login" | "register">("login");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            toast.error("Ingresa tu correo y contraseña");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) throw error;

            toast.success("¡Bienvenido!");
            window.location.href = "/";
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Credenciales incorrectas");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            toast.error("Completa todos los campos");
            return;
        }
        if (password.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
            });

            if (error) throw error;

            if (data.user) {
                // Create profile in profiles table
                await supabase.from("profiles").upsert({
                    id: data.user.id,
                    email: email.trim(),
                    role: "user",
                    account_tier: "basic",
                    is_active: true,
                }, { onConflict: "id" });

                toast.success("¡Cuenta creada! Bienvenido a Almuerzo.cl");
                window.location.href = "/";
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Error al crear la cuenta");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-[100dvh] overflow-hidden bg-background">
            {/* Top Banner / Logo Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-primary/5 relative">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -ml-32 -mb-32" />

                <div className="relative z-10 w-64 max-w-full h-auto flex flex-col items-center justify-center mb-6">
                    <img
                        src="/images/logo.png"
                        alt="Almuerzo.cl Logo"
                        className="w-full h-auto drop-shadow-md"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/logo.jpg';
                        }}
                    />
                </div>

                <p className="text-muted-foreground font-medium text-center mt-2 max-w-xs z-10 text-sm">
                    0% delivery, 100% comida rica
                </p>
            </div>

            {/* Login Form Area */}
            <div className="bg-background w-full mx-auto p-6 md:p-10 flex-none rounded-t-3xl -mt-6 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] relative z-20 md:max-w-md">
                <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8 sm:hidden" />

                <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-6">
                    <div className="space-y-2 text-center sm:text-left">
                        <h2 className="text-2xl font-bold tracking-tight">
                            {mode === "login" ? "Ingresa a tu cuenta" : "Crea tu cuenta"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {mode === "login"
                                ? "Usa tu correo electrónico y contraseña."
                                : "Regístrate para reservar y pedir en tus restaurantes favoritos."
                            }
                        </p>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                                Correo Electrónico
                            </Label>
                            <Input
                                id="email"
                                placeholder="correo@ejemplo.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-14 md:h-12 text-base bg-muted/50 border-transparent focus:bg-background transition-colors rounded-xl px-4"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                                Contraseña
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Tu contraseña"}
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-14 md:h-12 text-base bg-muted/50 border-transparent focus:bg-background transition-colors rounded-xl px-4 pr-12"
                                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 md:h-12 text-base font-semibold shadow-md group rounded-xl"
                        >
                            {loading
                                ? (mode === "login" ? "Ingresando..." : "Creando cuenta...")
                                : (mode === "login" ? "Iniciar Sesión" : "Crear Cuenta")
                            }
                            {!loading && (
                                mode === "login"
                                    ? <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    : <UserPlus className="w-5 h-5 ml-2" />
                            )}
                        </Button>
                    </div>

                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={() => setMode(mode === "login" ? "register" : "login")}
                            className="text-sm text-primary font-bold hover:underline underline-offset-4"
                        >
                            {mode === "login"
                                ? "¿No tienes cuenta? Regístrate aquí"
                                : "¿Ya tienes cuenta? Inicia sesión"
                            }
                        </button>
                    </div>
                </form>

                <p className="mt-8 text-center text-[11px] text-muted-foreground leading-relaxed px-4">
                    Al continuar, aceptas nuestros{" "}
                    <a href="#" className="font-medium text-primary hover:underline underline-offset-4">Términos</a>{" "}
                    y{" "}
                    <a href="#" className="font-medium text-primary hover:underline underline-offset-4">Privacidad</a>.
                </p>

            </div>
        </div>
    );
}
