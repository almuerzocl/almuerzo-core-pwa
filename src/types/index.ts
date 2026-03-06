// Core Data Models for Almuerzo V5

export interface Restaurant {
    id: string;
    name: string;
    description: string;
    phone: string;
    address: {
        street: string;
        number: string;
        additional?: string;
        commune: string;
    };
    location: any;
    image_url: string;
    logo_url?: string;
    cover_image_url?: string;
    cuisine_type: string;
    capacity: number;
    spaces: string[];
    space_capacities: Record<string, number>;
    operating_hours: Array<{
        day: string;
        hours: string;
    }>;
    rating: {
        google: number;
        opinions: number;
    };
    payment_methods: string[];
    is_sponsored: boolean;
    is_featured: boolean;
    is_active: boolean;
    is_new: boolean;
    price_level: number;
    price_range: string;
    comuna: string;
    has_takeaway: boolean;
    has_reservations: boolean;
    available_services: string[]; // ["para servir", "para llevar"]
    service_rules: any;
    average_prep_time: number;
    slot_duration: number;
    billing_plan: string;
    user_limit: number;
    last_menu_sent_at?: string;
    created_at: string;
    updated_at: string;
}

export interface MenuItem {
    id: string;
    restaurant_id: string;
    name: string;
    description?: string;
    price: number;
    category: string;
    image_url?: string;
    item_type: 'permanent' | 'temporary';
    is_available: boolean;
    is_available_for_takeaway?: boolean;
    takeaway_price?: number;
    daily_stock?: number;
    stock_managed?: boolean;
    current_stock?: number;
    is_menu_del_dia?: boolean;
    preparation_time?: number;
    created_at: string;
}

export interface UserProfile {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    photo_url?: string;
    phone?: string;
    phone_number?: string;
    role: 'admin' | 'user' | 'super_admin';
    restaurant_id?: string;
    reservation_reputation?: number;
    total_reservations?: number;
    takeaway_reputation?: number;
    total_takeaway_orders?: number;
    account_type: 'free' | 'elite';
    onboarding_completed?: boolean;
    default_address?: string;
    default_address_lat?: number;
    default_address_lng?: number;
    favorite_restaurant_ids?: string[];
    subscribed_daily_menu_ids?: string[];
    preferred_payment_methods?: string[];
    created_at: string;
}

export interface Contact {
    id: string;
    owner_id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    whatsapp_phone?: string;
    avatar_url?: string;
    created_at?: string;
}

export type OrderStatus = 'PENDIENTE' | 'RECHAZADA' | 'CONFIRMADO' | 'PREPARANDO' | 'LISTO' | 'COMPLETADO' | 'CANCELADO' | 'NO_RETIRADO';
export type ReservationStatus = 'CREADA' | 'PENDIENTE' | 'CONFIRMADA' | 'CHECK-IN CLIENTE' | 'COMPLETADA' | 'CANCELADA' | 'RECHAZADA' | 'NO_SHOW';
export type UserRole = 'admin' | 'user' | 'super_admin';

export interface Reservation {
    id: string;
    organizer_id: string;
    restaurant_id: string;
    title?: string;
    date_time: string;
    status: ReservationStatus;
    guests: Array<{
        id?: string;
        contact_id?: string;
        name: string;
        email?: string;
        phone?: string;
        is_organizer: boolean;
        status: string;
        selected_discount?: any;
        user_id?: string;
    }>;
    guest_ids: string[];
    payment_method?: string;
    special_requests?: string;
    unique_code?: string;
    timestamps: {
        created_at: string;
        received_at?: string;
        confirmed_at?: string;
        arrived_at?: string;
    };
    created_at: string;
}
