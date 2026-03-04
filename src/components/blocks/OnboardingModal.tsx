"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2, PartyPopper, CheckCircle } from "lucide-react";
import Autocomplete from "react-google-autocomplete";
import toast from "react-hot-toast";

export function OnboardingModal() {
    const { user, profile, isLoading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<"welcome" | "address" | "success">("welcome");
    const [loading, setLoading] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<{
        address: string;
        lat: number;
        lng: number;
    } | null>(null);

    useEffect(() => {
        // Only show if user is logged in, profile is loaded, and onboarding is not completed
        if (!isLoading && user && profile && profile.onboarding_completed === false) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [user, profile, isLoading]);

    const handleCompleteOnboarding = async () => {
        if (!user || !selectedAddress) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    default_address: selectedAddress.address,
                    default_address_lat: selectedAddress.lat,
                    default_address_lng: selectedAddress.lng,
                    onboarding_completed: true
                })
                .eq('id', user.id);

            if (error) throw error;

            setStep("success");
        } catch (err: any) {
            console.error("Error updating onboarding:", err);
            toast.error("Hubo un problema al guardar tu dirección");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        // We don't force a reload, the context should eventually update or 
        // the user will see it next time. Actually, if we just set it true in the DB,
        // it's fine. 
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            // Prevent closing by clicking outside if not finished
            if (open === false && step !== "success") return;
            setIsOpen(open);
        }}>
            <DialogContent className="sm:max-w-[440px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">

                {step === "welcome" && (
                    <div className="p-8 space-y-6 text-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto ring-8 ring-primary/5">
                            <PartyPopper className="w-10 h-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <DialogTitle className="text-2xl font-black tracking-tight">¡Bienvenido a Almuerzo.cl!</DialogTitle>
                            <DialogDescription className="text-muted-foreground font-medium">
                                Estamos felices de tenerte aquí. Antes de empezar, necesitamos configurar tu ubicación para mostrarte los mejores menús cerca de ti.
                            </DialogDescription>
                        </div>
                        <Button
                            onClick={() => setStep("address")}
                            className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-primary/20"
                        >
                            Comenzar ahora
                        </Button>
                    </div>
                )}

                {step === "address" && (
                    <div className="p-8 space-y-6">
                        <div className="space-y-2 text-center">
                            <DialogTitle className="text-2xl font-black tracking-tight">Tu Dirección</DialogTitle>
                            <DialogDescription className="font-medium text-muted-foreground">
                                ¿Dónde te encuentras? Así podremos recomendarte locales con delivery o retiro cercano.
                            </DialogDescription>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground ml-1">Dirección exacta</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary z-10" />
                                    <Autocomplete
                                        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                                        onPlaceSelected={(place: any) => {
                                            if (place && place.formatted_address) {
                                                setSelectedAddress({
                                                    address: place.formatted_address,
                                                    lat: place.geometry.location.lat(),
                                                    lng: place.geometry.location.lng()
                                                });
                                            }
                                        }}
                                        options={{
                                            types: ["address"],
                                            componentRestrictions: { country: "cl" },
                                        }}
                                        className="flex h-14 w-full bg-muted/50 border-transparent focus:bg-background transition-colors rounded-2xl pl-12 pr-4 py-2 text-base font-bold ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                                        placeholder="Busca tu calle y número..."
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium px-1">
                                    Ej: Av. Providencia 1234, Providencia
                                </p>
                            </div>

                            <Button
                                onClick={handleCompleteOnboarding}
                                disabled={loading || !selectedAddress}
                                className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-primary/20 mt-4"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : "Finalizar configuración"}
                            </Button>
                        </div>
                    </div>
                )}

                {step === "success" && (
                    <div className="p-8 space-y-6 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto ring-8 ring-green-50">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <div className="space-y-2">
                            <DialogTitle className="text-2xl font-black tracking-tight">¡Todo listo!</DialogTitle>
                            <DialogDescription className="font-medium text-muted-foreground">
                                Tu dirección ha sido guardada. Ahora disfruta de los mejores almuerzos de Santiago.
                            </DialogDescription>
                        </div>
                        <Button
                            onClick={handleClose}
                            className="w-full h-14 rounded-2xl text-lg font-black bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
                        >
                            ¡Vamos a comer!
                        </Button>
                    </div>
                )}

            </DialogContent>
        </Dialog>
    );
}
