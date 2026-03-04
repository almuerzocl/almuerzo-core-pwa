// packages/pwa/lib/invitations.ts
'use client';

import { sendEmailAction } from '@/app/actions/email-actions';

/**
 * Placeholder service for sending reservation invitations.
 * In a real production app you would integrate with SendGrid (email), Twilio/WhatsApp API, and Google Calendar API.
 * For now we simply log the actions and return a resolved promise so the UI flow works.
 */

export async function sendEmailInvitation({
    toEmail,
    subject,
    body,
}: {
    toEmail: string;
    subject: string;
    body: string;
}) {
    // Call Server Action
    const result = await sendEmailAction({
        to: toEmail,
        subject: subject,
        text: body
    });

    if (!result.success) {
        console.error('Failed to send email:', result.error);
        throw new Error(`Email failed: ${result.error}`);
    } else {
        console.log('✅ Email sent successfully to:', toEmail);
    }
}

export async function sendWhatsAppInvitation({
    phoneNumber,
    message,
}: {
    phoneNumber: string;
    message: string;
}) {
    console.log('📱 Sending WhatsApp invitation', { phoneNumber, message });
    // WhatsApp deep link – opens the chat with prefilled message
    const link = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
        message
    )}`;
    // In a PWA you can open a new window/tab – here we just return the link for the caller to use.
    return Promise.resolve(link);
}

export async function sendGoogleCalendarInvitation({
    title,
    startISO,
    endISO,
    description,
    location,
    cardLink,
}: {
    title: string;
    startISO: string;
    endISO: string;
    description: string;
    location?: string;
    cardLink?: string;
}) {
    const finalDescription = cardLink
        ? `${description}\n\nVer ticket de reserva: ${cardLink}`
        : description;

    console.log('📅 Creating Google Calendar link', {
        title,
        startISO,
        endISO,
        description: finalDescription,
        location,
    });

    // Format date specifically for Chile (America/Santiago)
    // This ensures we extract the correct YYYYMMDDTHHMMSS that represents the local time in Chile
    // regardless of the server (or browser) timezone.
    const formatToChileTime = (iso: string) => {
        const d = new Date(iso);
        const formatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'America/Santiago',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        const parts = formatter.formatToParts(d);
        const getPart = (type: string) => parts.find(p => p.type === type)?.value;
        return `${getPart('year')}${getPart('month')}${getPart('day')}T${getPart('hour')}${getPart('minute')}${getPart('second')}`;
    };

    const startDate = formatToChileTime(startISO);
    const endDate = formatToChileTime(endISO);
    const dates = `${startDate}/${endDate}`;

    const link = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        title
    )}&dates=${dates}&details=${encodeURIComponent(finalDescription)}&location=${encodeURIComponent(
        location || ''
    )}&ctz=America/Santiago`;
    return Promise.resolve(link);
}
