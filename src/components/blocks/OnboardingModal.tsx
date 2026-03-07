"use client";

import { useState, useEffect } from "react";
import { PartyPopper, Loader2, CheckCircle } from "lucide-react";
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
import { AddressAutocomplete } from "@/components/ui/AddressAutocomplete";
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
        if (!user) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    onboarding_completed: true
                })
                .eq('id', user.id);

            if (error) throw error;

            setStep("success");
        } catch (err: any) {
            console.error("Error updating onboarding:", err);
            toast.error("Hubo un problema al configurar tu cuenta");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (open === false && step !== "success") return;
            setIsOpen(open);
        }}>
            <DialogContent 
                className="sm:max-w-[440px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl"
            >

                {step === "welcome" && (
                    <div className="p-8 space-y-6 text-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto ring-8 ring-primary/5">
                            <PartyPopper className="w-10 h-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <DialogTitle className="text-2xl font-black tracking-tight">¡Bienvenido a Almuerzo.cl!</DialogTitle>
                            <DialogDescription className="text-muted-foreground font-medium">
                                Estamos felices de tenerte aquí. Prepárate para descubrir los mejores menús ejecutivos cerca de ti.
                            </DialogDescription>
                        </div>
                        <Button
                            onClick={handleCompleteOnboarding}
                            disabled={loading}
                            className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-primary/20"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : "Comenzar ahora"}
                        </Button>
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
                                Tu cuenta ha sido configurada. Ahora disfruta de los mejores almuerzos de Santiago.
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
