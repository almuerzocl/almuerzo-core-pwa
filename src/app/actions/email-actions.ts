'use server';

import { Resend } from 'resend';

// Delay initialization to prevent build-time crashes
let resendInstance: Resend | null = null;

function getResend() {
    if (!resendInstance && process.env.RESEND_API_KEY) {
        resendInstance = new Resend(process.env.RESEND_API_KEY);
    }
    return resendInstance;
}

interface EmailPayload {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export async function sendEmailAction({ to, subject, text, html }: EmailPayload) {
    try {
        const resend = getResend();
        if (!resend) {
            console.warn('⚠️ RESEND_API_KEY is not set or Resend failed to initialize. Email not sent.');
            return { success: false, error: 'Missing API Key' };
        }

        const fromEmail = process.env.EMAIL_FROM || 'Almuerzo.cl <quiero@almuerzo.cl>';

        // Development Override: Redirect all emails to a specific address if configured
        // This allows testing the flow without needing the actual guest email to be verified in Resend (during onboarding)
        let recipient = to;
        let finalSubject = subject;

        if (process.env.FORCE_TO_EMAIL) {
            recipient = process.env.FORCE_TO_EMAIL;
            finalSubject = `[TEST-REDIRECT from ${to}] ${subject}`;
        }

        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: [recipient],
            subject: finalSubject,
            text: text,
            html: html || `<p>${text.replace(/\n/g, '<br>')}</p>`, // Fallback HTML
        });

        if (error) {
            console.error('Resend Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (err: any) {
        console.error('Server Action Error:', err);
        return { success: false, error: err.message };
    }
}
