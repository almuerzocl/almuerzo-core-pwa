import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/tasks/close-pending
export async function GET(request: Request) {
    try {
        console.log('[Cron - 05:00] Cerrando reservas y pedidos pendientes...');

        const today = new Date().toISOString().split('T')[0];

        // 1. Marcar reservas PENDIENTES o CONFIRMADAS pasadas como NO SHOW
        const { error: resError } = await supabase
            .from('reservations')
            .update({ status: 'NO_SHOW' })
            .in('status', ['PENDIENTE', 'CONFIRMADA'])
            .lt('date_time', today);

        if (resError) {
            console.error('Error cerrando reservas:', resError);
        }

        // 2. Marcar pedidos PENDIENTES o PREPARANDO pasados como NO RETIRADO
        const { error: orderError } = await supabase
            .from('takeaway_orders')
            .update({ status: 'NO_RETIRADO' })
            .in('status', ['PENDIENTE', 'PREPARANDO', 'LISTO'])
            .lt('created_at', today);

        if (orderError) {
            console.error('Error cerrando pedidos:', orderError);
        }

        return NextResponse.json({ success: true, message: 'Cierre de día ejecutado' });
    } catch (error: any) {
        console.error('[Cron] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
