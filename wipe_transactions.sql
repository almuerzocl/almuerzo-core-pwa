-- Eliminación completa (truncate) de transacciones para reiniciar pruebas
-- ADVERTENCIA: Esto borrará todas las reservas y pedidos históricos.

-- 1. Vaciar reservas en mesa
TRUNCATE TABLE public.reservations CASCADE;

-- 2. Vaciar pedidos para llevar (takeaway)
TRUNCATE TABLE public.takeaway_orders CASCADE;

-- 3. (Opcional) Si en el futuro agregas tablas relacionadas a reservas, 
-- el CASCADE se encargará de borrar cualquier registro dependiente, así queda todo limpio.
