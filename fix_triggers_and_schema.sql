-- Database Patch: Fix trigger errors and improve schema consistency
-- 1. Add missing state columns that old/ghost triggers might expect
ALTER TABLE public.takeaway_orders ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
ALTER TABLE public.takeaway_orders ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone;
ALTER TABLE public.takeaway_orders ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone;

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone;

-- 2. Ensure contacts table is robust
-- Allow null emails if not provided
ALTER TABLE public.contacts ALTER COLUMN email DROP NOT NULL;

-- 3. Notify schema reload
NOTIFY pgrst, 'reload schema';
