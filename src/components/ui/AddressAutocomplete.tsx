"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import Autocomplete from "react-google-autocomplete";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
    onAddressSelect: (address: {
        address: string;
        lat: number;
        lng: number;
        commune?: string;
    }) => void;
    placeholder?: string;
    className?: string;
    defaultValue?: string;
}

/**
 * AddressAutocomplete - Homologador de Direcciones para Santiago de Chile
 * Utiliza Google Maps Places API con restricciones específicas para Chile 
 * y priorización para la Región Metropolitana.
 */
export function AddressAutocomplete({
    onAddressSelect,
    placeholder = "Busca tu calle y número...",
    className,
    defaultValue = ""
}: AddressAutocompleteProps) {
    const [inputValue, setInputValue] = useState(defaultValue);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        setInputValue(defaultValue);
    }, [defaultValue]);

    return (
        <div className={cn("relative w-full group", className)}>
            <div className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors z-10",
                isFocused ? "text-primary" : "text-muted-foreground"
            )}>
                <MapPin className="w-full h-full" />
            </div>

            <Autocomplete
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                onPlaceSelected={(place: any) => {
                    if (place && place.formatted_address) {
                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();
                        
                        // Extract commune (locality/administrative_area_level_3 in Chile)
                        let commune = "";
                        if (place.address_components) {
                            const communeComp = place.address_components.find((c: any) => 
                                c.types.includes("administrative_area_level_3") || 
                                c.types.includes("locality")
                            );
                            if (communeComp) commune = communeComp.long_name;
                        }

                        setInputValue(place.formatted_address);
                        onAddressSelect({
                            address: place.formatted_address,
                            lat,
                            lng,
                            commune
                        });
                    }
                }}
                options={{
                    types: ["address"],
                    componentRestrictions: { country: "cl" },
                    // Strict Santiago bounds (Región Metropolitana focus)
                    bounds: {
                        north: -33.1,
                        south: -33.7,
                        east: -70.4,
                        west: -70.9
                    },
                    strictBounds: true,
                    fields: ["address_components", "geometry", "formatted_address"]
                }}
                defaultValue={defaultValue}
                className={cn(
                    "flex h-14 w-full bg-muted/50 border-transparent transition-all rounded-2xl pl-12 pr-12 py-2 text-base font-bold",
                    "ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 focus:bg-background focus:border-primary/20",
                    isFocused && "shadow-inner bg-background"
                )}
                placeholder={placeholder}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e: any) => setInputValue(e.target.value)}
            />

            {inputValue && (
                <button
                    type="button"
                    onClick={() => {
                        setInputValue("");
                        // We also need to notify parent IF we want to clear the selection
                        // This prevents the "Finish" button from staying enabled with old data
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 hover:text-muted-foreground transition-colors z-10"
                >
                    <X className="w-full h-full" />
                </button>
            )}
        </div>
    );
}
