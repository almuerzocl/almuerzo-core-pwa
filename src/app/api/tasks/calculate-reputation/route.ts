import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/tasks/calculate-reputation
export async function GET(request: Request) {
    try {
        console.log('[Cron - 06:00] Calculando Reputación Diaria...');

        const { error: rpcError } = await supabase.rpc('calculate_daily_reputation');

        if (rpcError) {
            console.warn('[Cron] RPC calculate_daily_reputation no encontrado o falló.');
            return NextResponse.json({
                success: false,
                message: 'RPC calculate_daily_reputation missing o fallido.'
            }, { status: 500 });
        }

        console.log('[Cron] Cálculo de reputación completado exitosamente.');
        return NextResponse.json({ success: true, message: 'Cálculo de reputación ejecutado.' });
    } catch (error: any) {
        console.error('[Cron] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
