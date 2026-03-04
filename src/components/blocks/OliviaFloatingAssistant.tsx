"use client";

import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogHeader
} from '@/components/ui/dialog';
import { OliviaAssistant } from './OliviaAssistant';
import { RestaurantData } from './RestaurantCard';

interface OliviaFloatingAssistantProps {
    onRestaurantClick?: (restaurant: RestaurantData) => void;
}

export function OliviaFloatingAssistant({ onRestaurantClick }: OliviaFloatingAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating Button */}
            <div className="fixed bottom-24 right-6 z-50">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="relative group p-4 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 shadow-2xl shadow-purple-500/40 border border-white/20 overflow-hidden"
                >
                    {/* Micro-animations */}
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                    </div>

                    {/* Tooltip/Badge simple */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white animate-bounce" />
                </motion.button>
            </div>

            {/* Modal Assistant */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-lg w-[95vw] overflow-hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Olivia Assistant</DialogTitle>
                        <DialogDescription>Asistente gastronómica por IA</DialogDescription>
                    </DialogHeader>

                    <div className="relative bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] p-1 border border-white/10 shadow-2xl">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-6 right-6 z-[60] p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="max-h-[85vh] overflow-y-auto scrollbar-none pb-8">
                            <OliviaAssistant
                                initialExpanded={true}
                                onRestaurantClick={(rest) => {
                                    setIsOpen(false);
                                    onRestaurantClick?.(rest);
                                }}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
