
-- ALMUERZO V5: PROFILES RLS REPAIR
-- Este script asegura que los usuarios puedan actualizar su propio perfil (favoritos, suscripciones, etc).

-- 1. Asegurar que RLS esté habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas existentes para evitar duplicados o conflictos
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view public profiles." ON public.profiles;

-- 3. Crear Políticas Robustas
-- SELECT: Cualquiera puede ver perfiles (necesario para ver nombres de amigos/contactos en el futuro)
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT 
USING (true);

-- INSERT: Solo el usuario autenticado puede crear su propia fila (usualmente vía trigger de auth.users, pero por si acaso)
CREATE POLICY "Users can insert their own profile." 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- UPDATE: CRITICAL - Permite actualizar favoritos y suscripciones
-- Usamos USING y WITH CHECK para máxima cobertura
CREATE POLICY "Users can update own profile." 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Notificar a PostgREST
NOTIFY pgrst, 'reload schema';

-- VERIFICACIÓN: Listar políticas aplicadas
SELECT tablename, policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';
