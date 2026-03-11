-- Almuerzo.cl V5 - RBAC Standardization Patch
-- This script updates the roles constraint to allow Uppercase and 
-- expanded roles used by the Admin and Restaurant Dashboards.

BEGIN;

-- 1. Drop the old constraint FIRST to allow the transition
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Standardize existing roles to Uppercase (The new standard)
UPDATE public.profiles 
SET role = UPPER(COALESCE(role, 'USER'));

-- 3. Update/Add the New Constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (UPPER(role) IN (
    'USER', 
    'ADMIN', 
    'SUPER_ADMIN', 
    'OWNER', 
    'RESTAURANT_ADMIN', 
    'OPERATIONS_MANAGER', 
    'RESERVATION_MANAGER', 
    'TAKEAWAY_MANAGER', 
    'MENU_MANAGER',
    -- Legacy support roles
    'RESERVAS', 
    'PEDIDOS', 
    'MENU',
    'ADMINISTRADOR'
));

-- 4. Ensure a default role exists for safety
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'USER';

COMMIT;
