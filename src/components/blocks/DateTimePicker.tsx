'use client';

import { useState, useMemo } from 'react';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { TIMEZONE } from '@/lib/config';
// import { Calendar, Clock } from 'lucide-react';

interface DateTimePickerProps {
    onSelect: (date: Date, time: string) => void;
    selectedDate?: Date;
    selectedTime?: string;
    operatingHours?: any[]; // We'll type this properly later
    availability?: { time: string; available: boolean; occupied: number; totalCapacity: number }[];
}

export default function DateTimePicker({ onSelect, selectedDate, selectedTime, availability }: DateTimePickerProps) {
    const [currentDate, setCurrentDate] = useState(selectedDate || startOfToday());
    const today = startOfToday();
    const nextTwoWeeks = Array.from({ length: 14 }, (_, i) => addDays(today, i));

    // Generate time slots based on availability info from server or default range
    const timeSlots = useMemo(() => {
        if (availability && availability.length > 0) {
            return availability.map(a => a.time);
        }

        // Fallback default range (08:00 to 23:30)
        return Array.from({ length: 32 }, (_, i) => {
            const totalMinutes = 8 * 60 + i * 30;
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        });
    }, [availability]);

    const handleDateClick = (date: Date) => {
        setCurrentDate(date);
        if (selectedTime) {
            onSelect(date, selectedTime);
        }
    };

    const handleTimeClick = (time: string) => {
        onSelect(currentDate, time);
    };

    // Helper to get current Santiago time for comparisons
    const getSantiagoNow = () => {
        return toZonedTime(new Date(), TIMEZONE);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Selecciona una fecha</h3>
                <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar">
                    {nextTwoWeeks.map((date) => {
                        const isSelected = isSameDay(date, currentDate);
                        return (
                            <button
                                key={date.toISOString()}
                                onClick={() => handleDateClick(date)}
                                className={`flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center border transition-all ${isSelected
                                    ? 'bg-orange-600 border-orange-600 text-white shadow-md'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                                    }`}
                            >
                                <span className="text-xs font-medium uppercase">
                                    {format(date, 'EEE', { locale: es })}
                                </span>
                                <span className="text-xl font-bold">
                                    {format(date, 'd')}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Selecciona una hora</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {timeSlots.map((time) => {
                        const [hours, minutes] = time.split(':').map(Number);
                        const slotDate = new Date(currentDate);
                        slotDate.setHours(hours, minutes, 0, 0);

                        const santiagoNow = getSantiagoNow();
                        const isPast = isSameDay(currentDate, santiagoNow) && slotDate < santiagoNow;


                        const slotAvailability = availability?.find(a => a.time === time);
                        const isFull = slotAvailability && !slotAvailability.available;
                        const isDisabled = isPast || isFull;

                        return (
                            <button
                                key={time}
                                onClick={() => !isDisabled && handleTimeClick(time)}
                                disabled={isDisabled}
                                className={`py-4 px-2 rounded-xl text-sm font-medium border transition-all flex flex-col items-center gap-1 ${selectedTime === time
                                    ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/40'
                                    : isDisabled
                                        ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed opacity-50'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                                    }`}
                            >
                                <span className="font-bold">{time}</span>
                                {slotAvailability && (
                                    <span className={`text-[9px] ${selectedTime === time ? 'text-white/80' : 'text-gray-400'}`}>
                                        {slotAvailability.occupied}/{slotAvailability.totalCapacity}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
