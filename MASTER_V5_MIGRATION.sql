-- ========================================================
-- ALMUERZO.CL - MASTER MIGRATION V5 (CORE CONSOLIDATED)
-- Purpose: Ensures database integrity, Lexicon alignment, and V5 feature support.
-- Applies: Formatting, Constraints, missing columns, and V5 RPCs.
-- ========================================================

-- 1. BASE TABLES & CORE EXTENSIONS
-- Ensure Contacts table is flexible for V5 invitees
ALTER TABLE IF EXISTS public.contacts ALTER COLUMN email DROP NOT NULL;
ALTER TABLE IF EXISTS public.contacts ADD COLUMN IF NOT EXISTS whatsapp_phone text;

-- 2. RESERVATIONS - LEXICON & V5 STRUCTURE ALIGNMENT
DO $$ 
BEGIN
    -- Core V5 Columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'guest_ids') THEN
        ALTER TABLE public.reservations ADD COLUMN guest_ids uuid[] DEFAULT '{}'::uuid[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'guests') THEN
        ALTER TABLE public.reservations ADD COLUMN guests jsonb DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'party_size') THEN
        ALTER TABLE public.reservations ADD COLUMN party_size integer DEFAULT 1;
    END IF;

    -- Snapshots (Business Engine Integrity)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'user_reputation_snapshot') THEN
        ALTER TABLE public.reservations ADD COLUMN user_reputation_snapshot integer;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'user_total_reservations_snapshot') THEN
        ALTER TABLE public.reservations ADD COLUMN user_total_reservations_snapshot integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'discount_data_snapshot') THEN
        ALTER TABLE public.reservations ADD COLUMN discount_data_snapshot jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'benefits_snapshot') THEN
        ALTER TABLE public.reservations ADD COLUMN benefits_snapshot jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'account_type_snapshot') THEN
        ALTER TABLE public.reservations ADD COLUMN account_type_snapshot text;
    END IF;

    -- Status & Audit
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'unique_code') THEN
        ALTER TABLE public.reservations ADD COLUMN unique_code text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'payment_method') THEN
        ALTER TABLE public.reservations ADD COLUMN payment_method text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'title') THEN
        ALTER TABLE public.reservations ADD COLUMN title text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'special_requests') THEN
        ALTER TABLE public.reservations ADD COLUMN special_requests text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'timestamps') THEN
        ALTER TABLE public.reservations ADD COLUMN timestamps jsonb DEFAULT '{}'::jsonb;
    END IF;

    -- Validation flags for completion logic
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'validated_by_user') THEN
        ALTER TABLE public.reservations ADD COLUMN validated_by_user boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'validated_by_restaurant') THEN
        ALTER TABLE public.reservations ADD COLUMN validated_by_restaurant boolean DEFAULT false;
    END IF;
END $$;

-- 3. TAKEAWAY ORDERS - LEXICON & V5 SNAPSHOTS
DO $$
BEGIN
    -- Matching CartPage metadata and snapshots
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'takeaway_orders' AND column_name = 'customer_name') THEN
        ALTER TABLE public.takeaway_orders ADD COLUMN customer_name text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'takeaway_orders' AND column_name = 'customer_phone') THEN
        ALTER TABLE public.takeaway_orders ADD COLUMN customer_phone text;
    END IF;

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

    -- Status timestamps for auditing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'takeaway_orders' AND column_name = 'approved_at') THEN
        ALTER TABLE public.takeaway_orders ADD COLUMN approved_at timestamp with time zone;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'takeaway_orders' AND column_name = 'confirmed_at') THEN
        ALTER TABLE public.takeaway_orders ADD COLUMN confirmed_at timestamp with time zone;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'takeaway_orders' AND column_name = 'rejected_at') THEN
        ALTER TABLE public.takeaway_orders ADD COLUMN rejected_at timestamp with time zone;
    END IF;
END $$;

-- 4. FIX CONSTRAINTS (CRITICAL)
-- Drop old restrictive constraint on takeaway_orders status
ALTER TABLE public.takeaway_orders DROP CONSTRAINT IF EXISTS takeaway_orders_status_check;
ALTER TABLE public.takeaway_orders ADD CONSTRAINT takeaway_orders_status_check 
    CHECK (status IN ('PENDIENTE', 'APROBADA', 'CONFIRMADO', 'RECHAZADA', 'PREPARANDO', 'LISTO', 'COMPLETADO', 'CANCELADO', 'NO_RETIRADO'));

ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check 
    CHECK (status IN ('CREADA', 'PENDIENTE', 'CONFIRMADA', 'CHECK-IN CLIENTE', 'COMPLETADA', 'CANCELADA', 'RECHAZADA', 'NO_SHOW'));

-- 5. BUSINESS ENGINE: UPDATED DISCOUNTS LOGIC (SANTIAGO AWARE)
-- Fix: Drop existing function to avoid return type mismatch errors (42P13)
DROP FUNCTION IF EXISTS public.get_my_available_discounts(uuid, text, date);

CREATE OR REPLACE FUNCTION public.get_my_available_discounts(
    p_restaurant_id uuid,
    p_service_type text DEFAULT 'takeaway',
    p_date date DEFAULT NULL
)
RETURNS TABLE (
    id uuid, label text, description text, type text, discount_percentage integer,
    service_scope text[], institution_id uuid, logo_url text
) AS $$
DECLARE
    v_date date;
    v_day_name text;
BEGIN
    v_date := COALESCE(p_date, (current_timestamp AT TIME ZONE 'America/Santiago')::date);
    v_day_name := trim(to_char(v_date, 'Day'));

    RETURN QUERY
    SELECT 
        d.id, d.label, d.description, 'promotion'::text as type, d.discount_percentage, 
        d.service_scope, d.institution_id, i.logo_url
    FROM public.discounts d
    LEFT JOIN public.institutions i ON i.id = d.institution_id
    WHERE d.restaurant_id = p_restaurant_id 
      AND d.is_active = true
      AND (d.start_date IS NULL OR d.start_date <= v_date)
      AND (d.end_date IS NULL OR d.end_date >= v_date)
      AND (d.valid_days IS NULL OR d.valid_days = '{}'::text[] OR v_day_name = ANY(d.valid_days))
      AND (d.service_scope IS NULL OR p_service_type = ANY(d.service_scope))
      AND (d.institution_id IS NULL OR EXISTS (
          SELECT 1 FROM public.user_institutions ui WHERE ui.user_id = auth.uid() AND ui.institution_id = d.institution_id
      ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
