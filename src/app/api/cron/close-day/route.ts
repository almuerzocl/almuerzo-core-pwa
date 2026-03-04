
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { startOfDay, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Endpoint para cierre automático de día.
 * Debe ser llamado por un Cron Job (ej: Vercel Cron, Cloud Scheduler).
 */
export async function GET(request: Request) {
    // Verificación de seguridad básica (se debe configurar una secret en producción)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const santiagoTime = toZonedTime(new Date(), 'America/Santiago');
        const dayStart = startOfDay(santiagoTime).toISOString();
        const dayEnd = endOfDay(santiagoTime).toISOString();

        console.log(`[CRON] Iniciando cierre de día: ${dayStart} - ${dayEnd}`);

        // 1. Cerrar Reservas no asistidas (No Shown)
        const { data: resData, error: resError } = await supabase
            .from('reservations')
            .update({ status: 'NO SHOW' })
            .in('status', ['PENDIENTE', 'CONFIRMADA'])
            .lte('date_time', dayEnd); // Reservas de hoy o anteriores que quedaron abiertas

        if (resError) throw resError;

        // 2. Cerrar Pedidos no recogidos
        const { data: orderData, error: orderError } = await supabase
            .from('takeaway_orders')
            .update({ status: 'NO RECOGIDO' })
            .in('status', ['PENDIENTE', 'PREPARANDO', 'LISTO'])
            .lt('created_at', dayStart); // Pedidos anteriores al día de hoy que siguen abiertos

        // También cerrar los del mismo día que ya pasaron su hora límite (si aplica)
        // Por ahora cerramos todos los que no llegaron a COMPLETADO al final del día.
        const { error: orderTodayError } = await supabase
            .from('takeaway_orders')
            .update({ status: 'NO RECOGIDO' })
            .in('status', ['PENDIENTE', 'PREPARANDO', 'LISTO', 'CONFIRMADA'])
            .lte('created_at', dayEnd);

        if (orderTodayError) throw orderTodayError;

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Cierre de día procesado correctamente'
        });

    } catch (err: any) {
        console.error('[CRON ERROR] Falló el cierre de día:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
