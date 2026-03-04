"use client";

import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Award, Ticket, Building2, ShieldAlert, CheckCircle2, Crown, Info, ExternalLink, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SubscriptionsPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [clubs, setClubs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchClubs = async () => {
            try {
                const { data, error } = await supabase
                    .from('user_discount_clubs')
                    .select('*, discount_clubs(*)')
                    .eq('user_id', user.id);

                if (!error && data) {
                    setClubs(data);
                } else {
                    setClubs([]);
                }
            } catch (err) {
                console.error(err);
                setClubs([]);
            } finally {
                setLoading(false);
            }
        };

        fetchClubs();
    }, [user]);

    if (!user) return null;

    const isElite = profile?.account_type === 'elite';

    return (
        <div className="w-full min-h-screen bg-slate-50 pb-24">
            <header className="sticky top-0 bg-white/80 backdrop-blur-xl z-50 border-b border-slate-100 p-4">
                <div className="max-w-md mx-auto flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-2xl bg-slate-100/50 hover:bg-slate-100 transition-colors shrink-0">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">Clubes y Beneficios</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ahorros y Alianzas</p>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-8">
                {/* Account Tier Hero */}
                <div className={`rounded-[2.5rem] p-8 text-white relative overflow-hidden transition-all duration-500 shadow-2xl ${isElite ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 shadow-indigo-500/20' : 'bg-gradient-to-br from-indigo-700 to-indigo-500 shadow-indigo-500/10'
                    }`}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        {isElite ? <Crown className="w-48 h-48 -mr-12 -mt-12 rotate-12" /> : <Award className="w-48 h-48 -mr-12 -mt-12 rotate-12" />}
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 rounded-full border border-white/20 backdrop-blur-md">
                            {isElite ? <Crown className="w-3 h-3 text-yellow-400" /> : <Award className="w-3 h-3 text-white/80" />}
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white">Nivel de Miembro</span>
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">
                                {isElite ? 'Elite' : 'Digital'}
                            </h2>
                            <p className="text-sm font-medium text-white/70 leading-relaxed uppercase tracking-wider">
                                {isElite ? 'Suscripción Premium Activa' : 'Cuenta Gratuita'}
                            </p>
                        </div>

                        {!isElite ? (
                            <div className="space-y-4 pt-2">
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-[11px] font-bold text-white/90">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-300" /> Reservas con prioridad
                                    </li>
                                    <li className="flex items-center gap-2 text-[11px] font-bold text-white/90">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-300" /> Descuentos exclusivos en locales seleccionados
                                    </li>
                                </ul>
                                <Button className="w-full bg-white text-indigo-900 hover:bg-slate-50 rounded-2xl h-14 font-black shadow-lg shadow-black/10 text-base">
                                    Subir a Elite
                                </Button>
                            </div>
                        ) : (
                            <div className="pt-2">
                                <p className="text-xs font-bold text-indigo-200">Disfrutas de beneficios ilimitados en toda la red Almuerzo.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Clubs Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="font-black text-xl tracking-tight text-slate-800">Instituciones y Clubes</h3>
                        <div className="bg-slate-200/50 px-2.5 py-1 rounded-full text-[10px] font-black text-slate-500 uppercase">
                            {clubs.length} Activos
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center py-10 space-y-4">
                            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sincronizando beneficios...</p>
                        </div>
                    ) : clubs.length > 0 ? (
                        <div className="grid gap-4">
                            {clubs.map((clubRel: any) => (
                                <BenefitCard key={clubRel.id} club={clubRel.discount_clubs} active={clubRel.is_active} />
                            ))}
                        </div>
                    ) : (
                        <div className="p-10 text-center space-y-6 bg-white rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                                <ShieldAlert className="w-8 h-8 text-slate-300" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-base text-slate-800 font-black">Sin clubes asociados</p>
                                <p className="text-xs text-slate-400 font-medium max-w-[200px] leading-tight">
                                    Vincular tu empresa o institución te permite acceder a descuentos directos.
                                </p>
                            </div>
                            <Button variant="outline" className="rounded-2xl border-2 font-bold h-12 px-8">
                                Vincular Institución
                            </Button>
                        </div>
                    )}
                </div>

                {/* Discovery Section */}
                <div className="bg-indigo-50/50 rounded-[2rem] p-6 border border-indigo-100 flex items-center gap-4 group cursor-pointer hover:bg-indigo-50 transition-colors">
                    <div className="bg-white p-3 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                        <Search className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-black text-slate-800 text-sm">Explorar Convenios</h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-tight">Ver todas las empresas y alianzas con beneficios activos.</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-300" />
                </div>
            </main>
        </div>
    );
}

function BenefitCard({ club, active }: any) {
    return (
        <div className="p-5 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between shadow-sm hover:border-indigo-500/30 transition-all group hover:shadow-md cursor-pointer">
            <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 overflow-hidden">
                    {club?.logo_url ? (
                        <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
                    ) : (
                        <Building2 className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors" />
                    )}
                </div>
                <div className="space-y-1">
                    <h4 className="font-black text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{club?.name || 'Club de Descuentos'}</h4>
                    <div className="flex items-center gap-2">
                        <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {active ? 'Activo' : 'Inactivo'}
                        </div>
                        <span className="text-[11px] font-bold text-slate-400">
                            {club?.discount_percent || 0}% de Ahorro
                        </span>
                    </div>
                </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full bg-slate-50 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                <Info className="w-4 h-4" />
            </Button>
        </div>
    );
}
