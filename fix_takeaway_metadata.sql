-- FIx for takeaway_orders metadata column
ALTER TABLE public.takeaway_orders ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Si se incluyeron otras columnas recientemente y no existen:
ALTER TABLE public.takeaway_orders ADD COLUMN IF NOT EXISTS user_reputation_snapshot JSONB;
ALTER TABLE public.takeaway_orders ADD COLUMN IF NOT EXISTS account_type_snapshot TEXT;
ALTER TABLE public.takeaway_orders ADD COLUMN IF NOT EXISTS benefits_snapshot JSONB;

-- Notificamos a PostgREST para que actualice la caché de esquemas y reconozca la(s) nueva(s) columna(s)
NOTIFY pgrst, 'reload schema';
