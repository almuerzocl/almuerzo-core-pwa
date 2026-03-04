-- Almuerzo.cl V5 Core Master Schema
-- Consolidation of all necessary tables, constraints, and RPCs for the V5 PWA

-- 1. Enable PostGIS for geolocation
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- =========================================================================================
-- PROFILES (Users)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE NOT NULL,
    first_name text,
    last_name text,
    display_name text,
    photo_url text,
    phone text,
    phone_number text,
    role text DEFAULT 'user'::text CHECK (role IN ('user', 'admin', 'super_admin')),
    account_type text DEFAULT 'free'::text CHECK (account_type IN ('free', 'elite')),
    
    -- V5 Specific: Reputation Bifurcation
    reservation_reputation integer DEFAULT 100 CHECK (reservation_reputation >= 0 AND reservation_reputation <= 100),
    takeaway_reputation integer DEFAULT 100 CHECK (takeaway_reputation >= 0 AND takeaway_reputation <= 100),
    total_reservations integer DEFAULT 0,
    total_takeaway_orders integer DEFAULT 0,
    
    -- V5 Specific: Native Arrays for Favorites and Subscriptions (Performance)
    favorite_restaurant_ids text[] DEFAULT '{}'::text[],
    subscribed_daily_menu_ids text[] DEFAULT '{}'::text[],
    preferred_payment_methods text[] DEFAULT '{}'::text[],
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- =========================================================================================
-- RESTAURANTS
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.restaurants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    phone text,
    
    -- Address and Geo
    address jsonb DEFAULT '{"street": "", "number": "", "commune": "Santiago"}'::jsonb,
    comuna text NOT NULL DEFAULT 'Santiago',
    location geography(POINT),
    
    -- Imagery
    image_url text,
    logo_url text,
    cover_image_url text,
    
    -- Details
    cuisine_type text DEFAULT 'Chilena',
    capacity integer DEFAULT 50,
    average_prep_time integer DEFAULT 20, -- in minutes
    price_level integer DEFAULT 2 CHECK (price_level >= 1 AND price_level <= 4),
    
    -- Flags
    is_sponsored boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    is_active boolean DEFAULT true,
    has_takeaway boolean DEFAULT true,
    has_reservations boolean DEFAULT true,
    
    -- Ratings
    rating_google numeric(3,1) DEFAULT 0.0,
    rating_opinions integer DEFAULT 0,
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restaurants are viewable by everyone." ON public.restaurants FOR SELECT USING (true);


-- =========================================================================================
-- MENU ITEMS
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.menu_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price integer NOT NULL,
    category text NOT NULL,
    image_url text,
    item_type text DEFAULT 'permanent' CHECK (item_type IN ('permanent', 'temporary')),
    
    -- V5 Specific
    is_available boolean DEFAULT true,
    is_available_for_takeaway boolean DEFAULT true,
    takeaway_price integer,
    is_menu_del_dia boolean DEFAULT false,
    
    -- Stock (Optional)
    stock_managed boolean DEFAULT false,
    current_stock integer DEFAULT 0,
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Menu items are viewable by everyone." ON public.menu_items FOR SELECT USING (true);


-- =========================================================================================
-- TAKEAWAY ORDERS
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.takeaway_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id),
    restaurant_id uuid REFERENCES public.restaurants(id),
    
    -- Snapshot data for historical integrity (V5 Rule)
    customer_name text,
    customer_phone text,
    user_reputation_snapshot integer,
    account_type_snapshot text,
    benefits_snapshot jsonb,
    
    items jsonb NOT NULL DEFAULT '[]'::jsonb,
    total_amount integer NOT NULL,
    
    -- Enforced Statuses
    status text DEFAULT 'PENDIENTE' CHECK (status IN ('PENDIENTE', 'RECHAZADA', 'PREPARANDO', 'LISTO', 'COMPLETADO', 'CANCELADO', 'NO_RETIRADO')),
    
    metadata jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.takeaway_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders." ON public.takeaway_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders." ON public.takeaway_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders." ON public.takeaway_orders FOR UPDATE USING (auth.uid() = user_id);


-- =========================================================================================
-- RESERVATIONS
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.reservations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id uuid REFERENCES public.profiles(id),
    restaurant_id uuid REFERENCES public.restaurants(id),
    
    date_time timestamp with time zone NOT NULL,
    party_size integer DEFAULT 2,
    
    -- Snapshot data
    organizer_reputation_snapshot integer,
    
    guest_data jsonb DEFAULT '[]'::jsonb,
    
    -- Enforced Statuses
    status text DEFAULT 'PENDIENTE' CHECK (status IN ('CREADA', 'PENDIENTE', 'CONFIRMADA', 'CHECK-IN CLIENTE', 'COMPLETADA', 'CANCELADA', 'RECHAZADA', 'NO_SHOW')),
    
    special_requests text,
    unique_code text UNIQUE,
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reservations." ON public.reservations FOR SELECT USING (auth.uid() = organizer_id);
CREATE POLICY "Users can create reservations." ON public.reservations FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Users can update own reservations." ON public.reservations FOR UPDATE USING (auth.uid() = organizer_id);


-- =========================================================================================
-- DISCOUNT CLUBS & SUBSCRIPTIONS
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.discount_clubs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    discount_percent integer DEFAULT 10,
    logo_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_discount_clubs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    club_id uuid REFERENCES public.discount_clubs(id) ON DELETE CASCADE,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, club_id)
);

ALTER TABLE public.discount_clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clubs are viewable by everyone." ON public.discount_clubs FOR SELECT USING (true);

ALTER TABLE public.user_discount_clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own club memberships" ON public.user_discount_clubs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own memberships" ON public.user_discount_clubs FOR ALL USING (auth.uid() = user_id);


-- =========================================================================================
-- OLIVIA AI ASSISTANT (Usage Tracking)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.olivia_usage_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    query_text text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.olivia_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own AI logs." ON public.olivia_usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI logs." ON public.olivia_usage_logs FOR INSERT WITH CHECK (auth.uid() = user_id);


-- =========================================================================================
-- REMOTE PROCEDURE CALLS (RPCs)
-- =========================================================================================

-- RPC: Calculate Daily Reputation (Run at 06:00 AM)
CREATE OR REPLACE FUNCTION public.calculate_daily_reputation()
RETURNS void AS $$
BEGIN
    -- Update Reservation Reputation (-15 pts per NO_SHOW)
    UPDATE public.profiles p
    SET reservation_reputation = GREATEST(0, 100 - (
        SELECT COUNT(*) * 15
        FROM public.reservations r
        WHERE r.organizer_id = p.id
        AND r.status = 'NO_SHOW'
        AND r.date_time > NOW() - INTERVAL '60 days'
    ));

    -- Update Takeaway Reputation (-15 pts per NO_RETIRADO)
    UPDATE public.profiles p
    SET takeaway_reputation = GREATEST(0, 100 - (
        SELECT COUNT(*) * 15
        FROM public.takeaway_orders t
        WHERE t.user_id = p.id
        AND t.status = 'NO_RETIRADO'
        AND t.created_at > NOW() - INTERVAL '60 days'
    ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
