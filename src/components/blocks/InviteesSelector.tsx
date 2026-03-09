'use client';

import { useState } from 'react';
import ContactCard from '@/components/ContactCard';
import ContactForm from '@/components/ContactForm';
import { UserPlus, Phone } from 'lucide-react';
import type { Contact } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

interface InviteesSelectorProps {
    contacts: Contact[]; // all contacts of the user
    selected: Contact[]; // currently selected invitees
    onAddInvitee: (c: Contact) => void;
    onRemoveInvitee: (id: string) => void;
}

export default function InviteesSelector({
    contacts,
    selected,
    onAddInvitee,
    onRemoveInvitee,
}: InviteesSelectorProps) {
    const { user } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 mb-2"><UserPlus className="w-5 h-5 inline-block mr-1" /> Invitados</h3>

            {/* List of already selected invitees */}
            <div className="grid gap-3 md:grid-cols-2">
                {selected.map((c) => (
                    <ContactCard
                        key={c.id}
                        contact={c}
                        onEdit={() => { }}
                        onDelete={() => onRemoveInvitee(c.id)}
                    />
                ))}
            </div>

            {/* Quick add from existing contacts */}
            <select
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500"
                onChange={(e) => {
                    const id = e.target.value;
                    if (!id) return;
                    const contact = contacts.find((c) => c.id === id);
                    if (contact) onAddInvitee(contact);
                }}
            >
                <option value="">+ Añadir de mis contactos</option>
                {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                    </option>
                ))}
            </select>

            {/* Manual entry for external invitee */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => setShowForm(true)}
                    className="py-2 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 font-medium text-sm"
                >
                    + Nuevo Contacto
                </button>
                <button
                    onClick={async () => {
                        try {
                            if (!('contacts' in navigator && 'ContactsManager' in window)) {
                                alert('Tu dispositivo no soporta la importación de contactos.');
                                return;
                            }
                            const props = ['name', 'email', 'tel'];
                            const opts = { multiple: true };
                            const phoneContacts = await (navigator as any).contacts.select(props, opts);

                            for (const c of phoneContacts) {
                                const nameParts = c.name?.[0]?.split(' ') || ['Invitado'];
                                const firstName = nameParts[0];
                                const lastName = nameParts.slice(1).join(' ') || '';

                                const tmp: Contact = {
                                    id: `tmp-${Date.now()}-${Math.random()}`,
                                    owner_id: user?.id || '',
                                    first_name: firstName,
                                    last_name: lastName,
                                    email: c.email?.[0] || '',
                                    whatsapp_phone: c.tel?.[0] || ''
                                };
                                await onAddInvitee(tmp);
                            }
                            toast.success("Contactos importados y guardados.");
                        } catch (ex) {
                            console.error('Error importing contacts:', ex);
                        }
                    }}
                    className="py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 font-medium text-sm"
                >
                    <Phone className="w-5 h-5" /> Desde Agenda
                </button>
            </div>

            {showForm && (
                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-dashed border-gray-200 animate-in fade-in zoom-in duration-200">
                    <ContactForm
                        onCancel={() => setShowForm(false)}
                        isSubmitting={isSaving}
                        onSubmit={async (data) => {
                            setIsSaving(true);
                            try {
                                // Create a temporary contact object
                                const tmp: Contact = {
                                    id: `tmp-${Date.now()}`,
                                    ...data,
                                } as any;
                                
                                // Parent (Wizard) will handle the DB persistence
                                await onAddInvitee(tmp);
                                setShowForm(false);
                            } catch (err) {
                                console.error("Error saving contact in selector:", err);
                            } finally {
                                setIsSaving(false);
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
}
