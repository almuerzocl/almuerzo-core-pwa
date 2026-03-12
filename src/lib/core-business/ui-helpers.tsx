import { ReservationStatus, OrderStatus } from '@/types';
import { 
    CheckCircle2, 
    Clock3, 
    XCircle, 
    MapPin, 
    AlertTriangle, 
    Package, 
    UtensilsCrossed,
    HelpCircle
} from 'lucide-react';
import React from 'react';

/**
 * Skill: Centralized Status Styling
 * Ensures all Almuerzo V5 interfaces use the same color palette for business states.
 */
export const getBusinessStatusStyles = (status: ReservationStatus | OrderStatus | string) => {
    const s = status?.toUpperCase();
    switch (s) {
        // Successful / Completed
        case 'COMPLETADA':
        case 'COMPLETADO':
            return 'bg-green-100 text-green-700 border-green-200';
        case 'CONFIRMADA':
        case 'CONFIRMADO':
        case 'LISTO':
        case 'ENTREGADA':
        case 'ENTREGADO':
            return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        
        // In Progress
        case 'CHECK-IN CLIENTE':
        case 'PREPARANDO':
        case 'MODIFICADA':
            return 'bg-blue-100 text-blue-700 border-blue-200';
        
        // Pending
        case 'PENDIENTE':
        case 'CREADA':
        case 'APROBADA':
            return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        
        // Cancelled / Negative
        case 'CANCELADA':
        case 'CANCELADO':
        case 'RECHAZADA':
        case 'RECHAZADO':
            return 'bg-red-100 text-red-700 border-red-200';
        case 'NO_SHOW':
        case 'NO SHOW':
        case 'NO_RETIRADO':
            return 'bg-zinc-800 text-white border-zinc-900';
        
        default:
            return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
};

/**
 * Skill: Centralized Status Icons
 * Ensures all Almuerzo V5 interfaces use the same icons for business states.
 */
export const getBusinessStatusIcon = (status: string, className?: string) => {
    const s = status?.toUpperCase();
    const props = { className: className || "w-5 h-5" };

    switch (s) {
        case 'COMPLETADA':
        case 'COMPLETADO':
            return <CheckCircle2 {...props} className={cn("text-green-500", props.className)} />;
        case 'CONFIRMADA':
        case 'CONFIRMADO':
        case 'LISTO':
            return <CheckCircle2 {...props} className={cn("text-emerald-500", props.className)} />;
        case 'CHECK-IN CLIENTE':
            return <MapPin {...props} className={cn("text-blue-500 animate-bounce", props.className)} />;
        case 'PREPARANDO':
            return <UtensilsCrossed {...props} className={cn("text-blue-500", props.className)} />;
        case 'PENDIENTE':
        case 'CREADA':
        case 'APROBADA':
            return <Clock3 {...props} className={cn("text-yellow-500", props.className)} />;
        case 'CANCELADA':
        case 'CANCELADO':
        case 'RECHAZADA':
        case 'RECHAZADO':
            return <XCircle {...props} className={cn("text-red-500", props.className)} />;
        case 'NO_SHOW':
        case 'NO SHOW':
        case 'NO_RETIRADO':
            return <XCircle {...props} className={cn("text-zinc-800", props.className)} />;
        default:
            return <HelpCircle {...props} className={cn("text-zinc-400", props.className)} />;
    }
};

// Helper to avoid duplicate cn if possible, but since we are in a lib, maybe just string concatenation
const cn = (...args: any[]) => args.filter(Boolean).join(' ');

/**
 * Skill: Currency Formatting
 * Standardizes CLP (Chilean Peso) representation across the PWA.
 */
export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(amount);
};

/**
 * Skill: Reputation Formatting
 * Standardizes reputation score display.
 */
export const formatReputation = (score: number) => {
    return `${Math.round(score)}%`;
};

/**
 * Skill: Initials Logic
 * Standardizes initial extraction for avatars.
 */
export const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.trim() || "";
    const last = lastName?.trim() || "";
    
    if (!first && !last) return 'U';
    
    if (first && last) {
        return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    }
    
    return first.charAt(0).toUpperCase() || last.charAt(0).toUpperCase() || 'U';
};
