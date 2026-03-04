"use client";

import { useState, useEffect } from "react";
import { MapPin, ChevronDown, Navigation, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

import Autocomplete from "react-google-autocomplete";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LocationSelector() {
    const { profile } = useAuth();
    const [address, setAddress] = useState("Av. Providencia, Santiago");
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (profile?.default_address) {
            setAddress(profile.default_address);
        }
    }, [profile]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button className="flex flex-col flex-1 truncate items-start text-left outline-none group">
                    <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1 group-hover:text-primary transition-colors">
                        <MapPin className="w-3 h-3 text-primary" /> Entregar/Buscar en:
                    </span>
                    <div className="flex items-center gap-1 w-full">
                        <span className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
                            {address}
                        </span>
                        <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </div>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-t-3xl sm:rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Cambiar ubicación</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Autocomplete
                            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                            onPlaceSelected={(place: any) => {
                                if (place && place.formatted_address) {
                                    setAddress(place.formatted_address);
                                    setIsOpen(false);
                                }
                            }}
                            options={{
                                types: ["address"],
                                componentRestrictions: { country: "cl" },
                            }}
                            defaultValue={address}
                            className="flex h-12 w-full bg-muted/50 border-transparent focus:bg-background transition-colors rounded-xl pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Buscar dirección en Santiago..."
                        />
                    </div>

                    <Button
                        variant="outline"
                        className="w-full h-12 justify-start gap-3 rounded-xl border-dashed border-primary/30 hover:bg-primary/5 hover:text-primary hover:border-primary/50 text-muted-foreground"
                    >
                        <Navigation className="w-4 h-4" />
                        <span className="font-semibold">Usar mi ubicación actual</span>
                    </Button>

                    {/* Frequent addresses removed to avoid mock data */}
                </div>
            </DialogContent>
        </Dialog>
    );
}
