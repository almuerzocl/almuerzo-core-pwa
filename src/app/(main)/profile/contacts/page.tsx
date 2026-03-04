"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Contact } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    UserPlus,
    Search,
    Trash2,
    Edit2,
    User,
    Loader2,
    ChevronLeft,
    UserCircle,
    Plus,
    X,
    Check
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ContactsPage() {
    const { user, profile } = useAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        whatsapp_phone: ""
    });

    const fetchContacts = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setContacts(data || []);
        } catch (err: any) {
            console.error("Error fetching contacts:", err);
            toast.error("No pudimos cargar tus contactos");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!formData.first_name || !formData.whatsapp_phone) {
            toast.error("Nombre y teléfono son obligatorios");
            return;
        }

        setLoading(true);
        try {
            if (editingContact) {
                const { error } = await supabase
                    .from('contacts')
                    .update({
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        email: formData.email,
                        whatsapp_phone: formData.whatsapp_phone
                    })
                    .eq('id', editingContact.id);

                if (error) throw error;
                toast.success("Contacto actualizado");
            } else {
                const { error } = await supabase
                    .from('contacts')
                    .insert([{
                        owner_id: user.id,
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        email: formData.email,
                        whatsapp_phone: formData.whatsapp_phone
                    }]);

                if (error) throw error;
                toast.success("Contacto guardado");
            }

            setFormData({ first_name: "", last_name: "", email: "", whatsapp_phone: "" });
            setIsAdding(false);
            setEditingContact(null);
            fetchContacts();
        } catch (err: any) {
            console.error("Error saving contact:", err);
            toast.error("Error al guardar el contacto");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que quieres eliminar este contacto?")) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('contacts')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success("Contacto eliminado");
            fetchContacts();
        } catch (err: any) {
            console.error("Error deleting contact:", err);
            toast.error("Error al eliminar");
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (contact: Contact) => {
        setEditingContact(contact);
        setFormData({
            first_name: contact.first_name || "",
            last_name: contact.last_name || "",
            email: contact.email || "",
            whatsapp_phone: contact.whatsapp_phone || ""
        });
        setIsAdding(true);
    };

    const filteredContacts = contacts.filter(c =>
        (c.first_name + " " + c.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!user) return null;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <div className="bg-background border-b border-border sticky top-0 z-50 p-4">
                <div className="max-w-lg mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/profile">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-black tracking-tight">Agenda de Contactos</h1>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Gestión de Invitados</p>
                        </div>
                    </div>
                    {!isAdding && (
                        <Button
                            onClick={() => setIsAdding(true)}
                            size="icon"
                            className="rounded-full shadow-lg shadow-primary/20"
                        >
                            <Plus className="w-5 h-5" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="max-w-lg mx-auto w-full p-4 space-y-6">

                {/* Search */}
                {!isAdding && (
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar en mis contactos..."
                            className="bg-background border-transparent shadow-sm h-12 rounded-2xl pl-11 focus-visible:ring-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                )}

                {/* Adding/Editing Form */}
                {isAdding ? (
                    <div className="bg-background border border-border p-6 rounded-[2rem] shadow-sm space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black tracking-tight">
                                {editingContact ? "Editar Contacto" : "Nuevo Contacto"}
                            </h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setIsAdding(false);
                                    setEditingContact(null);
                                    setFormData({ first_name: "", last_name: "", email: "", whatsapp_phone: "" });
                                }}
                                className="rounded-full h-8 w-8 p-0"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground ml-1">Nombre</Label>
                                    <Input
                                        placeholder="ej: Juan"
                                        className="h-12 bg-muted/30 border-transparent rounded-xl"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground ml-1">Apellido</Label>
                                    <Input
                                        placeholder="ej: Perez"
                                        className="h-12 bg-muted/30 border-transparent rounded-xl"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground ml-1">WhatsApp / Teléfono</Label>
                                <Input
                                    placeholder="+56 9..."
                                    className="h-12 bg-muted/30 border-transparent rounded-xl"
                                    value={formData.whatsapp_phone}
                                    onChange={(e) => setFormData({ ...formData, whatsapp_phone: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground ml-1">Email (Opcional)</Label>
                                <Input
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    className="h-12 bg-muted/30 border-transparent rounded-xl"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <Button disabled={loading} className="w-full h-14 rounded-2xl font-black text-lg mt-4 shadow-lg shadow-primary/10">
                                {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                                {editingContact ? "Actualizar" : "Guardar Contacto"}
                            </Button>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {loading && contacts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                <p className="text-sm font-bold text-muted-foreground">Cargando tus contactos...</p>
                            </div>
                        ) : filteredContacts.length > 0 ? (
                            filteredContacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    className="bg-card border border-border p-4 rounded-3xl flex items-center justify-between group hover:border-primary/20 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black">
                                            {contact.first_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground">
                                                {contact.first_name} {contact.last_name}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground font-medium">
                                                {contact.whatsapp_phone} {contact.email ? `• ${contact.email}` : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full text-muted-foreground hover:text-primary"
                                            onClick={() => startEdit(contact)}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(contact.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white/50 border border-dashed border-border rounded-3xl p-12 text-center space-y-4">
                                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                    <UserPlus className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">Aún no tienes contactos</p>
                                    <p className="text-[11px] text-muted-foreground max-w-[200px] mx-auto">
                                        Agrega a tus amigos y colegas para invitarlos rápidamente a tus reservas.
                                    </p>
                                </div>
                                <Button onClick={() => setIsAdding(true)} variant="outline" className="rounded-2xl font-bold">
                                    Agregar mi primer contacto
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Legal Info Placeholder (Ley de contactos) */}
                {!isAdding && (
                    <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-3">
                        <div className="flex items-center gap-2 text-primary">
                            <Shield className="w-5 h-5" />
                            <h3 className="font-black text-sm uppercase tracking-tight">Privacidad y Ley de Contactos</h3>
                        </div>
                        <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">
                            En cumplimiento con la normativa de protección de datos, tus contactos solo se utilizan para facilitar el proceso de invitación a mesas reservadas.
                            <strong> Almuerzo.cl no utiliza estos datos para fines comerciales.</strong>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Re-using same Shield icon
function Shield(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        </svg>
    )
}
