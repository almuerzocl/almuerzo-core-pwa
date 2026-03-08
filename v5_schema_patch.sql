-- V5 Schema Patch: Align database with ReservationWizard and CartPage code
-- Run this if you find missing columns in reservations or takeaway_orders

-- 1. Ensure Contacts table exists
CREATE TABLE IF NOT EXISTS public.contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    first_name text,
    last_name text,
    email text,
    whatsapp_phone text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security for Contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own contacts." ON public.contacts FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own contacts." ON public.contacts FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own contacts." ON public.contacts FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own contacts." ON public.contacts FOR DELETE USING (auth.uid() = owner_id);


-- 2. Update Reservations Table
-- Check if columns exist before adding (using a DO block for safety)
DO $$
BEGIN
    -- Basic info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'payment_method') THEN
        ALTER TABLE public.reservations ADD COLUMN payment_method text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'title') THEN
        ALTER TABLE public.reservations ADD COLUMN title text;
    END IF;

    -- Guest handling
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'guest_ids') THEN
        ALTER TABLE public.reservations ADD COLUMN guest_ids uuid[] DEFAULT '{}'::uuid[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'guests') THEN
        ALTER TABLE public.reservations ADD COLUMN guests jsonb DEFAULT '[]'::jsonb;
    END IF;

    -- Reputation & Stats
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'user_reputation_snapshot') THEN
        ALTER TABLE public.reservations ADD COLUMN user_reputation_snapshot integer;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'user_total_reservations_snapshot') THEN
        ALTER TABLE public.reservations ADD COLUMN user_total_reservations_snapshot integer DEFAULT 0;
    END IF;

    -- Discounts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'discount_data_snapshot') THEN
        ALTER TABLE public.reservations ADD COLUMN discount_data_snapshot jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'applied_discount_id') THEN
        ALTER TABLE public.reservations ADD COLUMN applied_discount_id uuid;
    END IF;

    -- Benefits & Account
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'account_type_snapshot') THEN
        ALTER TABLE public.reservations ADD COLUMN account_type_snapshot text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'benefits_snapshot') THEN
        ALTER TABLE public.reservations ADD COLUMN benefits_snapshot jsonb;
    END IF;

    -- Validation flags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'validated_by_user') THEN
        ALTER TABLE public.reservations ADD COLUMN validated_by_user boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'validated_by_restaurant') THEN
        ALTER TABLE public.reservations ADD COLUMN validated_by_restaurant boolean DEFAULT false;
    END IF;

    -- Timestamps object
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'timestamps') THEN
        ALTER TABLE public.reservations ADD COLUMN timestamps jsonb DEFAULT '{}'::jsonb;
    END IF;

END $$;


-- 3. Ensure Takeaway Orders has consistent V5 columns (some might already exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'takeaway_orders' AND column_name = 'user_reputation_snapshot') THEN
        ALTER TABLE public.takeaway_orders ADD COLUMN user_reputation_snapshot integer;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'takeaway_orders' AND column_name = 'account_type_snapshot') THEN
        ALTER TABLE public.takeaway_orders ADD COLUMN account_type_snapshot text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'takeaway_orders' AND column_name = 'benefits_snapshot') THEN
        ALTER TABLE public.takeaway_orders ADD COLUMN benefits_snapshot jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'takeaway_orders' AND column_name = 'metadata') THEN
        ALTER TABLE public.takeaway_orders ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;


-- 4. Discount Logic Core Infrastructure
-- Link restaurants to discount clubs and specific rules
CREATE TABLE IF NOT EXISTS public.restaurant_discount_clubs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE,
    club_id uuid REFERENCES public.discount_clubs(id) ON DELETE CASCADE,
    active_days text[] DEFAULT '{"MO","TU","WE","TH","FR","SA","SU"}'::text[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(restaurant_id, club_id)
);

-- Policy for viewing restaurant-club links
ALTER TABLE public.restaurant_discount_clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view restaurant-club links." ON public.restaurant_discount_clubs FOR SELECT USING (true);


-- Create View for daily active discounts (as expected by the RPC/code)
CREATE OR REPLACE VIEW public.daily_active_discounts AS
SELECT 
    rdc.id as rdc_id,
    rdc.restaurant_id,
    rdc.active_days,
    dc.id as club_id,
    dc.name,
    dc.description,
    dc.discount_percent as discount_percentage,
    dc.is_active as club_active,
    rdc.is_active as restaurant_link_active
FROM public.restaurant_discount_clubs rdc
JOIN public.discount_clubs dc ON rdc.club_id = dc.id;


-- RPC to get user's available discounts for a specific context
CREATE OR REPLACE FUNCTION public.get_my_available_discounts(
    p_restaurant_id uuid,
    p_service_type text,
    p_date date
)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    discount_percentage integer,
    label text
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_day_code text;
BEGIN
    -- Map day of week to 'MO', 'TU', etc.
    v_day_code := CASE EXTRACT(DOW FROM p_date)
        WHEN 0 THEN 'SU'
        WHEN 1 THEN 'MO'
        WHEN 2 THEN 'TU'
        WHEN 3 THEN 'WE'
        WHEN 4 THEN 'TH'
        WHEN 5 THEN 'FR'
        WHEN 6 THEN 'SA'
    END;

    RETURN QUERY
    SELECT 
        dad.club_id as id,
        dad.name,
        dad.description,
        dad.discount_percentage,
        dad.name as label -- alias used by front-end mapping
    FROM public.daily_active_discounts dad
    JOIN public.user_discount_clubs udc ON dad.club_id = udc.club_id
    WHERE dad.restaurant_id = p_restaurant_id
      AND dad.club_active = true
      AND dad.restaurant_link_active = true
      AND udc.user_id = auth.uid()
      AND udc.is_active = true
      AND v_day_code = ANY(dad.active_days);
END;
$$;
