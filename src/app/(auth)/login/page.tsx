"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, UserPlus, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mode, setMode] = useState<"login" | "register">("login");
    const [pageError, setPageError] = useState<string | null>(null);

    const { signOut } = useAuth();

    useEffect(() => {
        const checkConfig = async () => {
            console.log("LoginPage: Checking initial config...");
            
            // Handle incomplete profile error from middleware
            const urlParams = new URLSearchParams(window.location.search);
            const errorParam = urlParams.get('error');
            
            if (errorParam === 'incomplete_profile') {
                console.warn("LoginPage: Incomplete profile detected, clearing session");
                setPageError("Tu sesión es incompleta. Por favor, ingresa de nuevo.");
                await supabase.auth.signOut();
                return;
            }

            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                console.log("LoginPage: getSession returned", { hasSession: !!session, error });
                
                if (error) throw error;
                
                if (session) {
                    console.log("LoginPage: Session found, performing clean redirect...");
                    window.location.href = "/";
                }
            } catch (err) {
                console.error("LoginPage: Initialization error:", err);
                setPageError("Error al conectar con el servidor. Por favor, intenta más tarde.");
            }
        };
        checkConfig();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            toast.error("Ingresa tu correo y contraseña");
            return;
        }

        setLoading(true);
        console.log("LoginPage: Attempting login for", email);
        try {
            const { error, data } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) throw error;

            console.log("LoginPage: Login successful as", data.user?.id);
            toast.success("¡Bienvenido!");
            
            // Force a full location change to ensure fresh state/avoid soft-routing hangs
            window.location.href = "/";
        } catch (err: any) {
            console.error("LoginPage: Login error", err);
            toast.error(err.message || "Credenciales incorrectas");
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !password.trim() || !firstName.trim() || !lastName.trim()) {
            toast.error("Completa todos los campos");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Las contraseñas no coinciden");
            return;
        }

        if (password.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setLoading(true);
        try {
            // we let AuthContext handle the profile upsert or we keep this one as well
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        first_name: firstName.trim(),
                        last_name: lastName.trim(),
                        display_name: `${firstName.trim()} ${lastName.trim()}`
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // Upsert here for immediate consistency
                const { error: profileError } = await supabase.from("profiles").upsert({
                    id: data.user.id,
                    email: email.trim(),
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    role: "user",
                    account_type: "free",
                    onboarding_completed: false,
                    favorite_restaurant_ids: [],
                    subscribed_daily_menu_ids: [],
                    preferred_payment_methods: []
                }, { onConflict: "id" });

                toast.success("¡Cuenta creada! Bienvenido a Almuerzo.cl");
                router.push("/");
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Error al crear la cuenta");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback` // Point to a proper callback if needed
                }
            });
            if (error) throw error;
        } catch (err: any) {
            toast.error("Error al iniciar sesión con Google");
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
            <div className="bg-background w-full mx-auto p-6 md:p-10 flex-none rounded-t-[3rem] -mt-6 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] relative z-20 md:max-w-md border-t border-muted/20">
                <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mb-8 sm:hidden" />

                <div className="space-y-6">
                    <div className="space-y-2 text-center">
                        <h2 className="text-3xl font-black tracking-tight text-foreground">
                            {mode === "login" ? "Ingresa a tu cuenta" : "Crea tu cuenta gratis"}
                        </h2>
                        <div className="text-sm font-medium">
                            {mode === "login" ? (
                                <>
                                    <span className="text-muted-foreground">¿No tienes cuenta? </span>
                                    <button onClick={() => setMode("register")} className="text-primary font-bold hover:underline">Regístrate</button>
                                </>
                            ) : (
                                <>
                                    <span className="text-muted-foreground">¿Ya tienes una cuenta? </span>
                                    <button onClick={() => setMode("login")} className="text-primary font-bold hover:underline">Inicia sesión</button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Error Banner - Only show if there is a real initialization error */}
                    {pageError && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-red-700">Ocurrió un problema</p>
                                <p className="text-xs text-red-600 font-medium">{pageError}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-5">
                        {mode === "register" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">
                                        Nombre
                                    </Label>
                                    <Input
                                        placeholder="User6"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="h-12 text-base bg-muted/40 border-transparent focus:bg-background transition-colors rounded-xl font-medium"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">
                                        Apellido
                                    </Label>
                                    <Input
                                        placeholder="Test"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="h-12 text-base bg-muted/40 border-transparent focus:bg-background transition-colors rounded-xl font-medium"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">
                                Correo electrónico
                            </Label>
                            <Input
                                placeholder="hola@ejemplo.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 text-base bg-muted/40 border-transparent focus:bg-background transition-colors rounded-xl font-medium"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">
                                Contraseña
                            </Label>
                            <div className="relative">
                                <Input
                                    placeholder="••••••••"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-12 text-base bg-muted/40 border-transparent focus:bg-background transition-colors rounded-xl font-medium pr-12"
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

                        {mode === "register" && (
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">
                                    Confirmar Contraseña
                                </Label>
                                <Input
                                    placeholder="••••••••"
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="h-12 text-base bg-muted/40 border-transparent focus:bg-background transition-colors rounded-xl font-medium"
                                    required
                                />
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 text-lg font-black shadow-lg shadow-primary/20 rounded-2xl transition-all active:scale-[0.98] mt-2"
                        >
                            {loading
                                ? (mode === "login" ? "Ingresando..." : "Creando cuenta...")
                                : (mode === "login" ? "Iniciar Sesión" : "Crear Cuenta")
                            }
                            {!loading && (
                                mode === "login"
                                    ? <ArrowRight className="w-5 h-5 ml-2" />
                                    : <UserPlus className="w-5 h-5 ml-2" />
                            )}
                        </Button>
                    </form>

                    {/* Google Login Disabled per requirements */}
                    {/* <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-muted" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-4 text-muted-foreground font-bold tracking-widest">O regístrate con</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full h-14 rounded-2xl border-2 border-muted hover:bg-muted/30 transition-all font-bold group"
                    >
                        ... (Google SVG) ...
                    </Button> */}

                    <p className="text-center text-[11px] text-muted-foreground leading-relaxed px-8">
                        Al continuar, aceptas nuestros{" "}
                        <a href="#" className="font-bold text-primary hover:underline">Términos</a>{" "}
                        y{" "}
                        <a href="#" className="font-bold text-primary hover:underline">Privacidad</a>.
                    </p>
                </div>
            </div>
        </div>
    );
}
