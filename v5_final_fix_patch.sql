-- ALMUERZO V5: INFRASTRUCTURE & BUSINESS LOGIC PATCH
-- This script adds missing RPC functions and ensures table schemas are updated
-- for correct operation of the ReservationWizard and CheckoutEngine.

-- 1. RPC: Match Guest to Existing User
-- Used by: ReservationWizard to link invitees to their Almuerzo accounts
CREATE OR REPLACE FUNCTION public.find_user_public_info(p_email text DEFAULT NULL, p_phone text DEFAULT NULL)
RETURNS TABLE (id uuid, first_name text, last_name text)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.first_name, p.last_name
    FROM public.profiles p
    WHERE (p_email IS NOT NULL AND p.email = p_email)
       OR (p_phone IS NOT NULL AND (p.phone = p_phone OR p.phone_number = p_phone))
    LIMIT 1;
END;
$$;

-- 2. RPC: Check Restaurant Availability (Legacy signature used by frontend)
-- Maps to the newer check_advanced_restaurant_availability logic if needed
CREATE OR REPLACE FUNCTION public.check_restaurant_availability(
    p_restaurant_id uuid,
    p_selected_time timestamp with time zone,
    p_party_size integer
)
RETURNS TABLE (is_available boolean, remaining_seats integer)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_total_capacity integer;
    v_occupied_seats integer;
BEGIN
    -- Get restaurant base capacity
    SELECT capacity INTO v_total_capacity FROM public.restaurants WHERE id = p_restaurant_id;
    
    -- Calculate occupied seats for that specific time (overlap logic simplified for RPC)
    SELECT COALESCE(SUM(party_size), 0) INTO v_occupied_seats
    FROM public.reservations
    WHERE restaurant_id = p_restaurant_id
      AND status IN ('CONFIRMADA', 'PENDIENTE', 'CREADA', 'CHECK-IN CLIENTE')
      -- Simplified overlap: same hour/minute (V5 logic usually handles windowing in server actions)
      AND date_time = p_selected_time;

    RETURN QUERY
    SELECT 
        (v_total_capacity - v_occupied_seats) >= p_party_size as is_available,
        (v_total_capacity - v_occupied_seats) as remaining_seats;
END;
$$;

-- 3. Ensure necessary columns exist in reservations for V5 snapshots
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS organizer_reputation_snapshot integer;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS account_type_snapshot text;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS benefits_snapshot jsonb;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS guest_ids uuid[] DEFAULT '{}'::uuid[];
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS guest_data jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS timestamps jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS unique_code text;

-- 4. Reload schema cache
NOTIFY pgrst, 'reload schema';
