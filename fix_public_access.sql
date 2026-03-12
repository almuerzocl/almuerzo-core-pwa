
-- FIX: Allow public access to tickets via unique_code
-- This is critical for the public-tickets app to work.

-- 1. Reservations Public Access
DROP POLICY IF EXISTS "Public access by unique_code" ON public.reservations;
CREATE POLICY "Public access by unique_code" 
ON public.reservations 
FOR SELECT 
USING (unique_code IS NOT NULL);

-- 2. Takeaway Orders Public Access
DROP POLICY IF EXISTS "Public access by unique_code" ON public.takeaway_orders;
CREATE POLICY "Public access by unique_code" 
ON public.takeaway_orders 
FOR SELECT 
USING (unique_code IS NOT NULL);

-- 3. Ensure restaurant data is also public (usually is, but for safety)
DROP POLICY IF EXISTS "Restaurants are viewable by everyone." ON public.restaurants;
CREATE POLICY "Restaurants are viewable by everyone." ON public.restaurants FOR SELECT USING (true);

-- Notificar a PostgREST
NOTIFY pgrst, 'reload schema';
