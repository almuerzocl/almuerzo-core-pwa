-- ALMUERZO V5: FINAL TRIGGER REPAIR FOR RESERVATIONS
-- Este parche soluciona el error "record new has no field user_id"
-- que indica que hay un trigger (posiblemente de reputación o notificaciones)
-- que intenta acceder a columnas que no existen en la tabla de reservaciones.

-- 1. AGREGAR COLUMNAS FALTANTES QUE EL TRIGGER REQUIERE
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 2. SINCRONIZAR ORGANIZER_ID CON USER_ID PARA COMPATIBILIDAD
-- Esto asegura que los triggers que busquen user_id encuentren el ID correcto.
UPDATE public.reservations SET user_id = organizer_id WHERE user_id IS NULL;

-- 3. RECARGAR ESQUEMA
NOTIFY pgrst, 'reload schema';

-- 4. VERIFICACIÓN DE COLUMNAS
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
AND column_name IN ('user_id', 'metadata', 'organizer_id');
