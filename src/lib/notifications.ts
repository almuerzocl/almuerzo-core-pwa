// packages/pwa/lib/notifications.ts
'use client';

import { supabase } from '@/lib/supabase';

interface NotificationData {
    id: string; // reservation or order id
    restaurantId: string;
    restaurantName: string;
    dateTime: string;
    partySize?: number; // for reservations
    itemCount?: number; // for orders
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    type: 'reservation' | 'order';
}

import { sendEmailAction } from '@/app/actions/email-actions';
import { sendGoogleCalendarInvitation } from './invitations';
import { TICKET_URL } from './config';

export async function sendReservationConfirmation(data: NotificationData) {
    try {
        console.log('📧 Sending confirmation email via Server Action...', data);

        const prefix = data.type === 'reservation' ? 'r' : 'o';
        const ticketUrl = `${TICKET_URL}/${prefix}/${data.id}`;

        // Duration approx 90 min (only for reservations)
        const start = new Date(data.dateTime);
        const end = new Date(isNaN(start.getTime()) ? new Date().getTime() + 90 * 60000 : start.getTime() + 90 * 60 * 1000);

        const calendarUrl = data.type === 'reservation' ? await sendGoogleCalendarInvitation({
            title: `Reserva en ${data.restaurantName}`,
            startISO: isNaN(start.getTime()) ? new Date().toISOString() : start.toISOString(),
            endISO: end.toISOString(),
            description: `¡Te esperamos!`,
            location: data.restaurantName,
            cardLink: ticketUrl
        }) : '';

        const subject = data.type === 'reservation' 
            ? `Reserva confirmada en ${data.restaurantName}`
            : `Pedido confirmado en ${data.restaurantName}`;
        
        const title = data.type === 'reservation' ? '¡Reserva Confirmada!' : '¡Pedido Confirmado!';
        const detailLabel = data.type === 'reservation' ? 'Fecha y Hora' : 'Fecha y Hora del Pedido';
        const quantityLabel = data.type === 'reservation' ? 'Personas' : 'Items';
        const quantityValue = data.type === 'reservation' ? `${data.partySize} Invitados` : `${data.itemCount} Items`;

        const result = await sendEmailAction({
            to: data.guestEmail,
            subject: subject,
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; color: #1a1a1a;">
                    <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 20px; color: white; margin-bottom: 30px; text-align: center; box-shadow: 0 10px 20px rgba(37, 99, 235, 0.1);">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px;">${title}</h1>
                    </div>

                    <p style="font-size: 18px; margin-bottom: 20px;">Hola <strong>${data.guestName}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a;">Tu experiencia en <strong>${data.restaurantName}</strong> ya está agendada. Estamos preparando todo para recibirte.</p>

                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; margin: 30px 0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding-bottom: 15px; width: 40px; font-size: 24px;">📅</td>
                                <td style="padding-bottom: 15px;">
                                    <strong style="color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">${detailLabel}</strong><br>
                                    <span style="font-size: 16px; font-weight: 700;">${data.dateTime}</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-bottom: 15px; width: 40px; font-size: 24px;">👥</td>
                                <td style="padding-bottom: 15px;">
                                    <strong style="color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">${quantityLabel}</strong><br>
                                    <span style="font-size: 16px; font-weight: 700;">${quantityValue}</span>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="text-align: center; margin-top: 40px; margin-bottom: 40px;">
                        <a href="${ticketUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 14px; box-shadow: 0 10px 15px rgba(0,0,0,0.1);">Ver mi Ticket Digital</a>
                        
                        ${calendarUrl ? `
                        <div style="margin-top: 25px;">
                            <a href="${calendarUrl}" style="color: #64748b; text-decoration: none; font-size: 14px; font-weight: 600; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px;">+ Añadir a Google Calendar</a>
                        </div>
                        ` : ''}
                    </div>

                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0;">

                    <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
                        Si necesitas cancelar o modificar tu reserva, por favor hazlo a través de tu ticket digital.<br>
                        <strong>¡Te esperamos!</strong><br><br>
                        © ${new Date().getFullYear()} Almuerzo.cl - Experiencias Gastronómicas
                    </p>
                </div>
            `,
            text: data.type === 'reservation' 
                ? `¡Tu reserva está confirmada! Te esperamos en ${data.restaurantName} el ${data.dateTime} para ${data.partySize} personas. Puedes verlo aquí: ${ticketUrl}`
                : `¡Tu pedido está confirmado! Te esperamos en ${data.restaurantName}. No olvides retirar tus ${data.itemCount} productos. Ticket: ${ticketUrl}`
        });

        if (!result.success) {
            console.error('Error sending email:', result.error);
            return { success: false, error: result.error };
        }

        console.log('✅ Email sent successfully:', result);
        return { success: true, data: result };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
    }
}

/**
 * Send SMS notification via Edge Function
 */
export async function sendReservationSMS(data: NotificationData) {
    if (!data.guestPhone) return { success: false, error: 'No phone number' };

    try {
        console.log('📱 Invoking send-sms function...', data);
        const { data: result, error } = await supabase.functions.invoke('send-sms', {
            body: {
                to: data.guestPhone,
                message: data.type === 'reservation'
                    ? `Reserva confirmada en ${data.restaurantName}. Fecha: ${data.dateTime}. Personas: ${data.partySize}. ¡Te esperamos!`
                    : `Pedido recibido en ${data.restaurantName}. Ya estamos trabajando en él. ¡Nos vemos pronto!`,
            },
        });

        if (error) {
            console.error('Error invoking send-sms:', error);
            return { success: false, error };
        }

        console.log('✅ SMS function response:', result);
        return { success: true, data: result };
    } catch (error) {
        console.error('Failed to invoke send-sms:', error);
        return { success: false, error };
    }
}

/**
 * Internal notification for Restaurant Admin (Realtime / DB)
 */
export async function notifyRestaurantAdmin(data: NotificationData) {
    try {
        console.log(`🔔 Notifying restaurant admin about ${data.type}...`, data.restaurantId);
        const title = data.type === 'reservation' ? 'Nueva Reserva Recibida 🍽️' : 'Nuevo Pedido Takeaway 🥡';
        const message = data.type === 'reservation' 
            ? `${data.guestName} reservó para ${data.partySize} personas el ${data.dateTime}`
            : `${data.guestName} realizó un pedido de ${data.itemCount} items`;

        const { error } = await supabase.rpc('notify_restaurant_admins', {
            p_restaurant_id: data.restaurantId,
            p_title: title,
            p_message: message,
            p_type: data.type,
            p_resource_id: data.id
        });

        if (error) {
            console.error('Error notifying restaurant admin:', error);
            return { success: false, error };
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to notify restaurant admin:', error);
        return { success: false, error };
    }
}

/**
 * Send all reservation notifications (email + SMS + Admin Alert)
 */
export async function sendReservationNotifications(data: Omit<NotificationData, 'type'> & { partySize: number }) {
    return sendAllNotifications({ ...data, type: 'reservation' });
}

export async function sendTakeawayOrderNotifications(data: Omit<NotificationData, 'type'> & { itemCount: number }) {
    return sendAllNotifications({ ...data, type: 'order' });
}

async function sendAllNotifications(data: NotificationData) {
    const results = await Promise.allSettled([
        sendReservationConfirmation(data),
        sendReservationSMS(data),
        notifyRestaurantAdmin(data)
    ]);

    return {
        email: results[0].status === 'fulfilled' ? (results[0].value as any) : { success: false },
        sms: results[1].status === 'fulfilled' ? (results[1].value as any) : { success: false },
        admin: results[2].status === 'fulfilled' ? (results[2].value as any) : { success: false }
    };
}
