'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import {
    Clock,
    Calendar,
    Users,
    User,
    CreditCard,
    Tag,
    AlertTriangle,
    CheckCircle,
    Phone,
    X,
    MessageSquare,
    ChevronRight,
    MapPin,
    ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import DateTimePicker from './DateTimePicker';
import InviteesSelector from './InviteesSelector';
// import RecurrencePicker from './RecurrencePicker';
import ShareReservationModal from './ShareReservationModal';
import { useAuth } from '@/context/AuthContext';

import { supabase } from '@/lib/supabase';
import { logReservationEvent } from '@/lib/reservations';
import { sendEmailInvitation, sendGoogleCalendarInvitation } from '@/lib/invitations';
import { sendReservationNotifications } from '@/lib/notifications';
import type { Contact } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { TICKET_URL } from '@/lib/config';
import { getRestaurantDailyAvailabilityAction } from '@/app/actions/reservation-actions';
import { checkCapacity, getAvailableDiscounts, checkUserDailyLimit, matchExistingUser, type Discount } from '@/lib/core-business';
import { CheckoutEngine } from '@/lib/core-business/checkout-engine';
import { BlockingToast } from './BlockingToast';

interface ReservationWizardProps {
    restaurantId: string;
    restaurantName: string;
    onClose: () => void;
    slotDuration?: number;
    address?: string;
}

// type Discount imported from core-business

type Step =
    | 'details'
    | 'invitees'
    | 'recurrence'
    | 'review'
    | 'confirmation';

function translateRRule(rule: string | null): string {
    if (!rule) return '';
    let text = 'Personalizado';

    // Frequency
    if (rule.includes('FREQ=WEEKLY')) text = 'Semanalmente';
    if (rule.includes('FREQ=MONTHLY')) text = 'Mensualmente';
    if (rule.includes('FREQ=DAILY')) text = 'Diariamente';

    // Days
    const days: Record<string, string> = {
        'MO': 'Lunes', 'TU': 'Martes', 'WE': 'Miércoles', 'TH': 'Jueves',
        'FR': 'Viernes', 'SA': 'Sábado', 'SU': 'Domingo'
    };

    // Extract BYDAY or BYWEEKDAY (rrule sometimes uses different keys depending on version/impl, stick to standard)
    // RecurrencePicker likely generates BYDAY or BYWEEKDAY
    // We'll search for typical patterns
    // Example: ...;BYDAY=MO;... or ...;BYDAY=MO,TU;...
    const byDayMatch = rule.match(/BYDAY=([A-Z,]+)/) || rule.match(/BYWEEKDAY=([A-Z,]+)/);

    if (byDayMatch) {
        const dayCodes = byDayMatch[1].split(',');
        const dayNames = dayCodes.map(d => days[d] || d).filter(Boolean);
        if (dayNames.length > 0) {
            text += ` los ${dayNames.join(', ')}`;
        }
    }

    return text;
}

export default function ReservationWizard({
    restaurantId,
    restaurantName,
    onClose,
    address,
    slotDuration
}: ReservationWizardProps) {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState<Step>('details');
    const [date, setDate] = useState<Date | undefined>(startOfToday());
    const [time, setTime] = useState<string | undefined>(undefined);
    const [reservationCode, setReservationCode] = useState<string>('');

    // Contacts & invitees
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedInvitees, setSelectedInvitees] = useState<Contact[]>([]);

    // Auto-calculate guests from selectedInvitees + organizer (1)
    const guests = selectedInvitees.length + 1;
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);

    const [shareToken, setShareToken] = useState<string>('');
    const [createdReservationId, setCreatedReservationId] = useState<string>('');

    // Payment & recurrence
    // Recurrence disabled
    const [recurrenceRule] = useState<string | null>(null);
    const [userPhone, setUserPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<string>('individual');

    // Fetch user contacts once
    useEffect(() => {
        if (user) {
            fetchContacts();
        }
        if (profile) {
            setUserPhone(profile.phone_number || profile.phone || user?.phone || user?.user_metadata?.phone || user?.user_metadata?.phone_number || '');
        } else if (user?.phone || user?.user_metadata?.phone) {
            setUserPhone(user?.phone || user?.user_metadata?.phone || '');
        }
    }, [user, profile]);

    const handleAddInvitee = async (contact: Contact) => {
        if (contact.id?.startsWith('tmp-')) {
            if (!user?.id) {
                toast.error('Inicia sesión para guardar contactos permanentemente');
                setSelectedInvitees(prev => [...prev, { ...contact, id: uuidv4() }]);
                return;
            }
            // Save to DB permanently right away
            setLoading(true);
            try {
                const { data: newContact, error } = await supabase
                    .from('contacts')
                    .insert({
                        owner_id: user.id,
                        first_name: contact.first_name || 'Invitado',
                        last_name: contact.last_name || '',
                        email: contact.email || null,
                        whatsapp_phone: contact.whatsapp_phone || null
                    })
                    .select()
                    .single();

                if (error) throw error;
                if (newContact) {
                    setSelectedInvitees(prev => [...prev, newContact]);
                    setContacts(prev => [...prev, newContact]);
                    toast.success(`${newContact.first_name} guardado en tus contactos`);
                    return newContact; // Return the saved contact
                }
            } catch (err: any) {
                console.error('Error saving contact:', err);
                toast.error('No se pudo guardar el contacto permanentemente, pero se añadió a la reserva.');
                // Fallback: still add it to the party but with a new uuid for the reservation record
                setSelectedInvitees(prev => [...prev, { ...contact, id: uuidv4() }]);
            } finally {
                setLoading(false);
            }
        } else {
            // Already an existing contact
            setSelectedInvitees(prev => [...prev, contact]);
        }
    };

    const fetchContacts = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('contacts')
            .select('*')
            .eq('owner_id', user.id)
            .order('first_name', { ascending: true });
        if (data) setContacts(data as any);
    };

    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);

    const [availability, setAvailability] = useState<any[]>([]);
    const [toastConfig, setToastConfig] = useState<{ isOpen: boolean, title: string, message: string, type: 'success' | 'loading' | 'error' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'loading'
    });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch availability
    useEffect(() => {
        if (restaurantId && date) {
            fetchAvailability();
        }
    }, [restaurantId, date]);

    const fetchAvailability = async () => {
        if (!date) return;
        const dateStr = format(date, 'yyyy-MM-dd');
        const result = await getRestaurantDailyAvailabilityAction(restaurantId, dateStr);
        if (result.success) {
            setAvailability(result.data || []);
        }
    };



    // Fetch discounts
    useEffect(() => {
        if (restaurantId && date) {
            fetchDiscounts();
        }
    }, [restaurantId, date]);

    const fetchDiscounts = async () => {
        if (!date) return;
        const available = await getAvailableDiscounts(restaurantId, date, 'reservation');
        setDiscounts(available);
    };

    // Filter discounts for selected date
    // Filter discounts for selected date
    const availableDiscounts = discounts; // Now filtered by the RPC already

    const handleDateSelect = (selectedDate: Date, selectedTime: string) => {
        setDate(selectedDate);
        setTime(selectedTime);
        setSelectedDiscount(null); // Reset discount when date changes
    };

    const checkAvailability = async (checkDate?: Date, checkTime?: string) => {
        const targetDate = checkDate || date;
        const targetTime = checkTime || time;
        if (!targetDate || !targetTime) return true; // Can't block if incomplete

        setLoading(true);
        try {
            const result = await checkCapacity(restaurantId, targetDate, targetTime, guests, 'reservation');
            if (!result.isAvailable) {
                toast.error(`Lo sentimos, el restaurante está lleno. Espacios: ${result.remainingSeats || 0}`);
                return false;
            }
            return true;
        } catch (err: any) {
            console.error('Error checking availability:', err);
            return true;
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        switch (step) {
            case 'details':
                if (!date || !time) {
                    toast.error('Por favor selecciona fecha y hora');
                    return;
                }

                // Sprint 2: Check availability before proceeding
                // Sprint 2: Check availability before proceeding
                // Only if date/time valid
                if (date && time) {
                    const isAvailable = await checkAvailability(date, time);
                    if (!isAvailable) return;
                }

                setStep('invitees');
                break;
            case 'invitees':
                // Recurrence not supported yet
                setStep('review');
                break;
            /* case 'recurrence':
                setStep('review');
                break; */
            case 'review':
                setLoading(true);
                try {
                    await handleSubmitReservation();
                } catch (err) {
                    console.error("Critical wizard failure:", err);
                } finally {
                    setLoading(false);
                }
                break;
        }
    };

    const handleSubmitReservation = async () => {
        if (!profile || !user) {
            toast.error("Debes iniciar sesión para reservar");
            return;
        }

        setLoading(true);
        setToastConfig({
            isOpen: true,
            title: 'Procesando Reserva',
            message: 'Estamos confirmando tu reserva con el restaurante...',
            type: 'loading'
        });

        try {
            const safeProfile = profile || {
                id: user.id,
                email: user.email,
                first_name: user?.user_metadata?.first_name || '',
                last_name: user?.user_metadata?.last_name || '',
                phone_number: user?.phone || '',
                account_type: 'free',
                total_reservations: 0,
                reservation_reputation: 100
            } as any;

            if (!date || !time) {
                setToastConfig({
                    isOpen: true,
                    title: 'Error de Validación',
                    message: 'Falta seleccionar fecha u hora.',
                    type: 'error'
                });
                return;
            }

            // 1. Motor de Negocio: Calcular reputación D-1
            const dailyReputation = await CheckoutEngine.calculateDailyReputation(user.id);

            // 2. Motor de Negocio: Aplicar beneficios de cuenta (Elite vs Free)
            const benefits = CheckoutEngine.applyAccountBenefits({ user: safeProfile, restaurantId });

            // 3. Prevenir límites
            const limits = await checkUserDailyLimit(user.id, 10);
            if (limits.isExceeded) {
                setToastConfig({
                    isOpen: true,
                    title: 'Límite Excedido',
                    message: 'Has alcanzado el límite diario de reservas.',
                    type: 'error'
                });
                return;
            }

            const resDateStr = format(date, 'yyyy-MM-dd');
            const resTimeStr = `${resDateStr} ${time}:00`;
            const reservationDate = fromZonedTime(resTimeStr, 'America/Santiago');

            // Contacts are already persisted in handleAddInvitee
            // Check for existing users among invitees (safe wrapper)
            const inviteesWithUsers = await Promise.all((selectedInvitees || []).map(async (inv) => {
                if (!inv) return null;
                try {
                    const userId = await matchExistingUser(inv.email, inv.whatsapp_phone);
                    return { ...inv, linked_user_id: userId };
                } catch (err) {
                    return { ...inv, linked_user_id: null };
                }
            }));

            const validInviteesWithUsers = inviteesWithUsers.filter(Boolean) as any[];

            const sessionInfo = CheckoutEngine.prepareSessionData(safeProfile);
            const organizerName = sessionInfo.fullName || user?.email || 'Usuario';
            const organizerEmail = sessionInfo.email;

            const guestsList = [
                {
                    id: uuidv4(),
                    name: organizerName,
                    email: organizerEmail,
                    phone: sessionInfo.contactPhone,
                    is_organizer: true,
                    status: 'CONFIRMADA',
                    notes: notes,
                    selected_discount: selectedDiscount ? {
                        id: selectedDiscount.id,
                        name: selectedDiscount.name,
                        percentage: selectedDiscount.discount_percentage
                    } : null
                },
                ...validInviteesWithUsers.map(inv => ({
                    id: uuidv4(),
                    name: `${inv.first_name || 'Invitado'} ${inv.last_name || ''}`.trim(),
                    email: inv.email || null,
                    phone: inv.whatsapp_phone || null,
                    is_organizer: false,
                    status: 'PENDIENTE',
                    user_id: inv.linked_user_id || null
                }))
            ];

            const { data: reservation, error } = await supabase
                .from('reservations')
                .insert({
                    restaurant_id: restaurantId,
                    organizer_id: user.id,
                    date_time: reservationDate.toISOString(),
                    status: 'PENDIENTE',
                    payment_method: paymentMethod,
                    title: `Reserva de ${organizerName}`,
                    guest_ids: selectedInvitees.map(c => c.id).filter(id => id && !id.startsWith('tmp-')),
                    guests: guestsList,
                    party_size: guestsList.length,
                    user_reputation_snapshot: dailyReputation.score,
                    user_total_reservations_snapshot: safeProfile.total_reservations ?? 0,
                    discount_data_snapshot: availableDiscounts,
                    applied_discount_id: selectedDiscount?.id || null,
                    account_type_snapshot: safeProfile.account_type,
                    benefits_snapshot: benefits,
                    validated_by_user: false,
                    validated_by_restaurant: false,
                    special_requests: notes,
                    unique_code: uuidv4().split('-')[0].toUpperCase(),
                    timestamps: { created_at: { at: new Date().toISOString() } }
                })
                .select('id, unique_code')
                .single();

            if (error) throw error;

            if (reservation) {
                setReservationCode(reservation.unique_code);
                setShareToken(reservation.unique_code);
                setCreatedReservationId(reservation.id);

                // Fire background tasks
                sendReservationNotifications({
                    id: reservation.id,
                    restaurantId: restaurantId,
                    restaurantName,
                    dateTime: format(reservationDate, "EEEE d MMMM 'a las' HH:mm", { locale: es }),
                    partySize: guests,
                    guestName: organizerName,
                    guestEmail: organizerEmail,
                    guestPhone: sessionInfo.contactPhone,
                }).catch(console.error);

                if (validInviteesWithUsers.length > 0) {
                    sendGoogleCalendarInvitation({
                        title: `Reserva en ${restaurantName}`,
                        startISO: reservationDate.toISOString(),
                        endISO: new Date(reservationDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
                        description: `Te invito a una reserva en ${restaurantName}.`,
                        location: restaurantName,
                        cardLink: `${TICKET_URL}/r/${reservation.unique_code}`
                    }).then((calendarLink) => {
                        validInviteesWithUsers.forEach(async (c) => {
                            const guestEntry = guestsList.find(g => (g.email === c.email && !g.is_organizer) || (g.phone === c.whatsapp_phone && !g.is_organizer));
                            if (!guestEntry) return;

                            const responseLink = `${TICKET_URL}/v/${reservation.unique_code}?g=${guestEntry.id}`;
                            const personalizedMessage = `Hola ${c.first_name}, te invito a una reserva en ${restaurantName} el ${format(reservationDate, "EEEE d MMMM, HH:mm", { locale: es })}. \n\nConfirmar asistencia aquí: ${responseLink}`;

                            if (c.email) {
                                sendEmailInvitation({
                                    toEmail: c.email,
                                    subject: `Invitación a reserva en ${restaurantName}`,
                                    body: `${personalizedMessage}\n\nEnlace de calendario: ${calendarLink}`,
                                }).catch(console.error);
                            }
                        });
                    }).catch(console.error);
                }

                setToastConfig({
                    isOpen: true,
                    title: '¡Reserva Solicitada!',
                    message: `Tu solicitud en ${restaurantName} ha sido enviada con éxito.`,
                    type: 'success'
                });

                setStep('confirmation');
            }

        } catch (err: any) {
            console.error('Error creating reservation:', err);
            let errorMessage = 'No pudimos procesar tu reserva. Intenta nuevamente.';
            if (err.details) errorMessage += ` Detalles: ${err.details}`;
            if (err.hint) errorMessage += ` Hint: ${err.hint}`;

            setToastConfig({
                isOpen: true,
                title: 'Error en la Reserva',
                message: errorMessage,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };



    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 bg-background/80 backdrop-blur-md transition-all">
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="bg-card w-full max-w-lg sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl ring-1 ring-border/50 overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-border/50 flex justify-between items-center bg-muted/30 sticky top-0 z-10 backdrop-blur-lg">
                    <div className="space-y-1">
                        <h2 className="font-extrabold text-xl md:text-2xl text-foreground tracking-tight flex items-center gap-2">
                            Reservar Mesa
                        </h2>
                        <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-primary" /> {restaurantName}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-background hover:bg-muted border border-border shadow-sm rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {/* Details */}
                        {step === 'details' && (
                            <motion.div
                                key="details"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 sm:space-y-8"
                            >
                                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-start gap-3 shadow-inner">
                                    <div className="bg-primary/10 p-2 rounded-xl shrink-0">
                                        <Users className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-semibold text-foreground">
                                            Mesa para {guests} persona(s)
                                        </p>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            Incluye al organizador y {selectedInvitees.length} invitado(s). Puedes añadir más en el siguiente paso.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-bold text-foreground tracking-tight">Selecciona Fecha y Hora</h3>
                                    <DateTimePicker
                                        onSelect={handleDateSelect}
                                        selectedDate={date}
                                        selectedTime={time}
                                        availability={availability}
                                    />
                                </div>


                                {/* Payment Method Selection */}
                                <div className="space-y-3">
                                    <h3 className="font-bold text-foreground tracking-tight">¿Quién paga la cuenta?</h3>
                                    <div className="relative">
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full p-4 border border-border rounded-2xl focus:ring-2 focus:ring-primary/50 outline-none bg-muted/30 hover:bg-muted/50 font-semibold text-foreground appearance-none cursor-pointer transition-colors"
                                        >
                                            <option value="individual">Cada uno paga lo suyo</option>
                                            <option value="organizer">Yo invito (La casa invita)</option>
                                            <option value="fixed">Monto fijo / Cuota por persona</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                            <ChevronRight className="w-5 h-5 rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                {/* Discount Selection */}
                                {date && availableDiscounts.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-foreground tracking-tight flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-primary" /> Promociones del Día
                                        </h3>
                                        <div className="grid gap-3">
                                            {availableDiscounts.map((discount) => (
                                                <div
                                                    key={discount.id}
                                                    onClick={() => setSelectedDiscount(selectedDiscount?.id === discount.id ? null : discount)}
                                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 relative overflow-hidden group ${selectedDiscount?.id === discount.id
                                                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                                                        : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30 hover:shadow-sm'
                                                        }`}
                                                >
                                                    {selectedDiscount?.id === discount.id && (
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                                    )}
                                                    <div className="flex justify-between items-center pl-2">
                                                        <div className="space-y-1">
                                                            <p className="font-bold text-foreground">{discount.name}</p>
                                                            <p className="text-xs text-muted-foreground">{discount.description}</p>
                                                        </div>
                                                        <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-xl font-bold text-sm shadow-sm flex items-center gap-1 group-hover:scale-105 transition-transform">
                                                            -{discount.discount_percentage}%
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3 pb-4">
                                    <h3 className="font-bold text-foreground tracking-tight">Notas especiales (opcional)</h3>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full p-4 border border-border rounded-2xl focus:ring-2 focus:ring-primary/50 outline-none resize-none h-28 bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all focus:bg-background"
                                        placeholder="Alergias, silla de bebé, ocasión especial..."
                                    />
                                </div>

                            </motion.div>
                        )}

                        {/* Invitees */}
                        {step === 'invitees' && (
                            <motion.div
                                key="invitees"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <InviteesSelector
                                    contacts={contacts}
                                    selected={selectedInvitees}
                                    onAddInvitee={handleAddInvitee}
                                    onRemoveInvitee={(id) => setSelectedInvitees((p) => p.filter((c) => c.id !== id))}
                                />
                            </motion.div>
                        )}

                        {/* Recurrence - DISABLED
                        {step === 'recurrence' && (
                            <motion.div
                                key="recurrence"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <RecurrencePicker onChange={setRecurrenceRule} />
                            </motion.div>
                        )}
                        */}

                        {/* Review */}
                        {step === 'review' && (
                            <motion.div
                                key="review"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-muted/40 p-6 rounded-[2rem] border border-border shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-foreground tracking-tight">Resumen Final</h3>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Verifica tus datos</p>
                                        </div>
                                    </div>

                                    <ul className="space-y-4 text-sm font-medium text-foreground">
                                        <li className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border shadow-sm">
                                            <div className="bg-primary/10 p-2 rounded-lg"><Calendar className="w-4 h-4 text-primary" /></div>
                                            {date && format(date, "EEEE d MMMM", { locale: es }).replace(/^\w/, c => c.toUpperCase())}
                                        </li>
                                        <li className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border shadow-sm">
                                            <div className="bg-primary/10 p-2 rounded-lg"><Clock className="w-4 h-4 text-primary" /></div>
                                            {time} hrs
                                        </li>
                                        <li className="flex items-center justify-between p-3 bg-background rounded-xl border border-border shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-primary/10 p-2 rounded-lg"><Users className="w-4 h-4 text-primary" /></div>
                                                <span>{guests} personas</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">{selectedInvitees.length > 0 ? `Tú + ${selectedInvitees.length} invitado(s)` : 'Solo tú'}</span>
                                        </li>
                                        <li className="flex items-center justify-between p-3 bg-background rounded-xl border border-border shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-primary/10 p-2 rounded-lg"><CreditCard className="w-4 h-4 text-primary" /></div>
                                                <span>Método de pago</span>
                                            </div>
                                            <span className="text-xs font-bold text-foreground">
                                                {paymentMethod === 'individual' ? 'Cada uno paga lo suyo' :
                                                    paymentMethod === 'organizer' ? 'Yo invito' : 'Cuota fija'}
                                            </span>
                                        </li>

                                        {selectedDiscount && (
                                            <li className="flex items-center justify-between p-3 bg-primary text-primary-foreground rounded-xl shadow-md shadow-primary/20">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-primary-foreground/20 p-2 rounded-lg"><Tag className="w-4 h-4 text-current" /></div>
                                                    <span className="font-bold">{selectedDiscount.name}</span>
                                                </div>
                                                <span className="font-extrabold text-base">-{selectedDiscount.discount_percentage}%</span>
                                            </li>
                                        )}
                                        <li className="flex items-center gap-3 px-1 py-2 text-muted-foreground">
                                            <User className="w-4 h-4" /> Organizador: <span className="text-foreground">{profile ? `${profile.first_name} ${profile.last_name}` : user?.email}</span>
                                        </li>
                                    </ul>
                                </div>
                            </motion.div>
                        )}

                        {/* Confirmation */}
                        {step === 'confirmation' && (
                            <motion.div
                                key="confirmation"
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="text-center py-10 px-4 flex flex-col items-center justify-center min-h-[350px]"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative"
                                >
                                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20"></div>
                                    <CheckCircle className="w-12 h-12 text-primary drop-shadow-md" />
                                </motion.div>
                                <h3 className="text-3xl font-extrabold text-foreground mb-2 tracking-tight">¡Reserva Exitosa!</h3>
                                <p className="text-muted-foreground font-medium mb-8">Te esperamos en {restaurantName}</p>

                                {reservationCode && (
                                    <div className="mb-8 w-full p-6 bg-card rounded-[2rem] border-2 border-dashed border-primary/30 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mb-2">Código de validación</p>
                                        <p className="text-4xl font-mono font-black text-foreground tracking-widest">{reservationCode}</p>
                                    </div>
                                )}

                                <div className="w-full space-y-3">
                                    <button
                                        onClick={() => window.open(`${TICKET_URL}/r/${reservationCode}`, '_blank')}
                                        className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 active:scale-95"
                                    >
                                        Ver mi Ticket
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-full h-14 bg-muted/50 text-foreground border border-border rounded-2xl font-semibold hover:bg-muted transition-colors active:scale-95"
                                    >
                                        Cerrar ventana
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                {
                    step !== 'confirmation' && (
                        <div className="p-5 border-t border-border/50 flex gap-3 bg-background/50 backdrop-blur-md rounded-b-[2rem]">
                            {step !== 'details' && (
                                <button onClick={() => setStep((prev) => {
                                    const order: Step[] = ['details', 'invitees', 'review'];
                                    const idx = order.indexOf(prev as any);
                                    return (order[Math.max(0, idx - 1)] || 'details') as Step;
                                })} className="px-5 h-14 border border-border bg-card text-foreground rounded-2xl font-bold hover:bg-muted transition-all active:scale-95 shadow-sm">
                                    Atrás
                                </button>
                            )}
                            <button onClick={handleNext} disabled={loading} className="flex-1 h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all disabled:opacity-50 active:scale-[0.98] shadow-md shadow-primary/20">
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Procesando
                                    </span>
                                ) : step === 'review' ? 'Reservar Mesa' : 'Siguiente Paso'}
                            </button>
                        </div>
                    )
                }

                {/* Share modal – appears after confirmation */}
                {
                    shareOpen && (
                        <ShareReservationModal
                            reservation={{
                                id: createdReservationId || '',
                                restaurant_name: restaurantName,
                                reservation_date: date ? date.toISOString() : '',
                                party_size: guests,
                                share_token: shareToken,
                                code: reservationCode || '',
                                address: address,
                                durationMinutes: slotDuration || 90
                            }}
                            onClose={() => setShareOpen(false)}
                        />
                    )
                }
            </motion.div >

            <BlockingToast
                isOpen={toastConfig.isOpen}
                title={toastConfig.title}
                message={toastConfig.message}
                type={toastConfig.type}
                onClose={() => setToastConfig((prev: any) => ({ ...prev, isOpen: false }))}
            />
        </div>,
        document.body
    );
}
