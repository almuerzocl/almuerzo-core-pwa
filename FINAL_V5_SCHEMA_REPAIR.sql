-- REPARACIÓN DEFINITIVA DEL ESQUEMA V5
-- Este script agrega todas las columnas de 'snapshot' y metadatos requeridas por el motor V5.

-- 1. Reparar tabla RESERVATIONS
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS guests jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS user_total_reservations_snapshot integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_data_snapshot jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS applied_discount_id uuid,
ADD COLUMN IF NOT EXISTS account_type_snapshot text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS benefits_snapshot jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS validated_by_user boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS validated_by_restaurant boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS timestamps jsonb DEFAULT '{"created_at": {"at": ""}}'::jsonb;

-- 2. Reparar tabla TAKEAWAY_ORDERS
ALTER TABLE public.takeaway_orders 
ADD COLUMN IF NOT EXISTS unique_code text,
ADD COLUMN IF NOT EXISTS user_reputation_snapshot integer DEFAULT 100,
ADD COLUMN IF NOT EXISTS account_type_snapshot text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS benefits_snapshot jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 3. Cleanup de campos redundantes o mal tipificados
COMMENT ON COLUMN public.reservations.guests IS 'Respaldo de guest_data para compatibilidad';
COMMENT ON COLUMN public.takeaway_orders.unique_code IS 'Código corto para validación del pedido';

-- Notificar a PostgREST para refrescar el caché
NOTIFY pgrst, 'reload schema';
