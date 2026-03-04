/**
 * Script para crear un usuario de prueba en Supabase Auth + profiles
 * Ejecutar con: node scripts/create-test-user.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cbvzkfqikwqddcdwmbos.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNidnprZnFpa3dxZGRjZHdtYm9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIxNzU0OSwiZXhwIjoyMDgwNzkzNTQ5fQ.N-YWBnFp-8xxAflAaIyhcTMydDe2VYSjYWiGNW2eyY8'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
})

async function createTestUser() {
    const testEmail = 'test@almuerzo.cl'
    const testPassword = 'almuerzo2026'

    console.log('🔄 Verificando si el usuario ya existe...')

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existing = existingUsers?.users?.find(u => u.email === testEmail)

    let userId

    if (existing) {
        console.log(`✅ Usuario ya existe: ${existing.id}`)
        userId = existing.id
    } else {
        // Create auth user
        console.log('🔄 Creando usuario en auth.users...')
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true, // Skip email confirmation
        })

        if (authError) {
            console.error('❌ Error creando usuario auth:', authError.message)
            return
        }

        userId = authData.user.id
        console.log(`✅ Usuario auth creado: ${userId}`)
    }

    // Upsert profile
    console.log('🔄 Creando/actualizando perfil...')
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            email: testEmail,
            first_name: 'Usuario',
            last_name: 'Demo',
            display_name: 'Demo Almuerzo',
            phone: '+56912345678',
            phone_number: '+56912345678',
            role: 'user',
            account_type: 'elite',
            reservation_reputation: 95,
            takeaway_reputation: 88,
            total_reservations: 12,
            total_takeaway_orders: 8,
            favorite_restaurant_ids: [],
            subscribed_daily_menu_ids: [],
        }, { onConflict: 'id' })

    if (profileError) {
        console.error('❌ Error creando perfil:', profileError.message)
        return
    }

    console.log('')
    console.log('═══════════════════════════════════════════')
    console.log('  🎉 USUARIO DE PRUEBA LISTO')
    console.log('═══════════════════════════════════════════')
    console.log(`  📧 Email:    ${testEmail}`)
    console.log(`  🔑 Password: ${testPassword}`)
    console.log(`  🆔 UUID:     ${userId}`)
    console.log(`  👤 Nombre:   Usuario Demo`)
    console.log(`  🏷️  Tipo:     Elite`)
    console.log('═══════════════════════════════════════════')
    console.log('')
    console.log('Puedes loguearte en la PWA con estas credenciales.')
}

createTestUser().catch(console.error)
