-- ALMUERZO V5: GLOBAL INFRASTRUCTURE REPAIR
-- Este parche asegura que todas las tablas tengan las columnas requeridas para la versión 5.
-- Copia y pega todo este código en tu SQL Editor de Supabase.

-- 1. REPARAR TABLA DE RESERVAS
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS guest_ids uuid[] DEFAULT '{}'::uuid[];
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS guest_data jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS party_size integer DEFAULT 1;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS special_requests text;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS unique_code text;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS organizer_reputation_snapshot integer;

-- 2. REPARAR TABLA DE PEDIDOS (TAKEAWAY)
ALTER TABLE public.takeaway_orders ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
ALTER TABLE public.takeaway_orders ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone;
ALTER TABLE public.takeaway_orders ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone;
ALTER TABLE public.takeaway_orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.takeaway_orders ADD COLUMN IF NOT EXISTS customer_phone text;

-- 3. AJUSTES DE CONTACTOS
ALTER TABLE public.contacts ALTER COLUMN email DROP NOT NULL;

-- 4. RECARGAR CACHÉ DE ESQUEMA
NOTIFY pgrst, 'reload schema';

-- VERIFICACIÓN
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('reservations', 'takeaway_orders') 
ORDER BY table_name;
