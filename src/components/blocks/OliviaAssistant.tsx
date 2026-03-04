"use client";

import { useState, useEffect, useCallback } from 'react';
import { Send, Sparkles, MessageSquare, Utensils, Zap, ThumbsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OliviaEngine, OliviaProposal } from '@/lib/core-business/olivia-engine';
import { RestaurantCard, RestaurantData } from './RestaurantCard';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface OliviaAssistantProps {
    onRestaurantClick?: (restaurant: RestaurantData) => void;
    initialExpanded?: boolean;
}

export function OliviaAssistant({ onRestaurantClick, initialExpanded = false }: OliviaAssistantProps = {}) {
    const { user, profile } = useAuth();
    const [query, setQuery] = useState('');
    const [isExpanded, setIsExpanded] = useState(initialExpanded);
    const [isThinking, setIsThinking] = useState(false);
    const [proposals, setProposals] = useState<OliviaProposal[]>([]);
    const [remainingUsage, setRemainingUsage] = useState<number | null>(null);

    const checkUsage = useCallback(async () => {
        if (!user) return;
        const remaining = await OliviaEngine.getRemainingUsage(user.id);
        setRemainingUsage(remaining);
    }, [user]);

    useEffect(() => {
        if (user) {
            checkUsage();
        }
    }, [user, checkUsage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error("Debes iniciar sesión para preguntarle a OlivIA", {
                icon: '🔒'
            });
            return;
        }

        if (remainingUsage !== null && remainingUsage <= 0) {
            toast.error("Has alcanzado tu límite diario de consultas", {
                icon: '⏳'
            });
            return;
        }

        if (!query.trim()) return;
        setIsThinking(true);
        setProposals([]);

        try {
            // Priority: Profile coordinates -> Santiago default
            const userCoords = {
                lat: profile?.default_address_lat || -33.4372,
                lng: profile?.default_address_lng || -70.6506
            };

            const results = await OliviaEngine.searchProposals(query, userCoords, user?.id);

            // Registrar uso y actualizar contador
            await OliviaEngine.recordUsage(user.id, query);
            await checkUsage();

            setProposals(results);
            setIsExpanded(true);
            if (results.length > 0) {
                // Mantener expandido para mostrar resultados
                setTimeout(() => {
                    const el = document.getElementById('olivia-proposals-container');
                    if (el) {
                        const y = el.getBoundingClientRect().top + window.scrollY - 150;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                }, 100);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsThinking(false);
        }
    };

    const suggestions = [
        "Comida saludable",

        "Menú ejecutivo hoy",
        "Sushi para 2 personas",
        "Lugar con terraza cerca"
    ];

    return (
        <div className="w-full">
            <div
                className={`bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-[2.5rem] shadow-xl overflow-hidden shadow-purple-500/20 ring-1 ring-white/20 transition-all duration-500 p-1`}
            >
                <div className="bg-background/10 backdrop-blur-sm rounded-[2.4rem] p-4 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30 shadow-inner">
                                <Sparkles className="w-5 h-5 text-yellow-200 fill-yellow-200/50" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg tracking-tight flex items-center gap-1.5">
                                    Pregúntale a <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-300">OlivIA</span>
                                </h3>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-white/70">Asistente Gastronómica</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {remainingUsage !== null && (
                                <div className="px-2.5 py-1.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-white/60">
                                        Libres: <span className="text-white">{remainingUsage}</span>
                                    </p>
                                </div>
                            )}
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
                            >
                                <Zap className={`w-4 h-4 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="relative group">
                        <textarea
                            placeholder="Ej: Tengo antojo de algo picante pero saludable..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setIsExpanded(true)}
                            className="w-full bg-white/10 border-2 border-white/10 rounded-3xl p-4 pr-14 text-sm placeholder:text-white/40 focus:bg-white/20 focus:border-white/30 focus:ring-0 outline-none resize-none transition-all min-h-[80px]"
                            rows={isExpanded ? 3 : 2}
                        />
                        <button
                            type="submit"
                            disabled={!query.trim() || isThinking}
                            className="absolute bottom-2.5 right-2.5 p-3 bg-white text-purple-600 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isThinking ? (
                                <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                            ) : (
                                <Send className="w-5 h-5 fill-purple-600/10" />
                            )}
                        </button>
                    </form>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                {/* Resultados de OlivIA */}
                                {proposals.length > 0 && (
                                    <div id="olivia-proposals-container" className="pt-6 space-y-4">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="h-px flex-1 bg-white/20"></div>
                                            <span className="text-[10px] font-black uppercase tracking-tighter text-white/60">Mis Propuestas para ti</span>
                                            <div className="h-px flex-1 bg-white/20"></div>
                                        </div>
                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20">
                                            {proposals.map((prop, idx) => (
                                                <div key={idx} className="space-y-2 group/prop">
                                                    <div className="bg-white/10 p-3 rounded-2xl border border-white/10 flex items-start gap-3">
                                                        <div className="bg-yellow-400 p-1.5 rounded-xl">
                                                            <ThumbsUp className="w-3 h-3 text-purple-700" />
                                                        </div>
                                                        <p className="text-xs font-medium leading-relaxed italic text-white/90">
                                                            &quot;{prop.reason}&quot;
                                                        </p>
                                                    </div>
                                                    <div className="scale-95 origin-top transition-transform group-hover/prop:scale-[0.98]">
                                                        <RestaurantCard
                                                            restaurant={prop.restaurant}
                                                            onClick={onRestaurantClick ? () => onRestaurantClick(prop.restaurant) : undefined}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 flex flex-wrap gap-2">
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setQuery(s)}
                                            className="text-[10px] font-bold bg-white/10 border border-white/20 px-3 py-2 rounded-xl hover:bg-white/20 transition-colors flex items-center gap-1.5"
                                        >
                                            <Utensils className="w-3 h-3 text-yellow-200" />
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center">
                                    <p className="text-[10px] text-white/40 font-medium flex items-center gap-1.5">
                                        <MessageSquare className="w-3 h-3" />
                                        Entiendo contextos, menús y tus preferencias.

                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
