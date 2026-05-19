'use client';

import { motion } from 'motion/react';
import { Zap, BarChart3, Flame } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';
import { DifficultyLevel } from '@ats-platform/types';

const difficultyConfig: Record<DifficultyLevel, {
    label: string;
    description: string;
    icon: typeof Zap;
    color: string;
    bg: string;
    gradient: string;
}> = {
    easy: {
        label: 'Dễ',
        description: '6 dễ · 3 trung bình · 1 khó',
        icon: Zap,
        color: '#34C759',
        bg: '#F0FDF4',
        gradient: 'from-[#34C759]/10 to-[#34C759]/5',
    },
    medium: {
        label: 'Trung bình',
        description: '2 dễ · 5 trung bình · 3 khó',
        icon: BarChart3,
        color: '#F59E0B',
        bg: '#FFFBEB',
        gradient: 'from-[#F59E0B]/10 to-[#F59E0B]/5',
    },
    hard: {
        label: 'Khó',
        description: '1 dễ · 3 trung bình · 6 khó',
        icon: Flame,
        color: '#FF3B30',
        bg: '#FEF2F2',
        gradient: 'from-[#FF3B30]/10 to-[#FF3B30]/5',
    },
};

interface DifficultySelectorProps {
    selected: DifficultyLevel | null;
    onSelect: (difficulty: DifficultyLevel) => void;
}

export function DifficultySelector({ selected, onSelect }: DifficultySelectorProps) {
    const levels: DifficultyLevel[] = ['easy', 'medium', 'hard'];

    return (
        <div className="grid grid-cols-3 gap-2.5">
            {levels.map((level) => {
                const config = difficultyConfig[level];
                const Icon = config.icon;
                const isSelected = selected === level;

                return (
                    <motion.button
                        key={level}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(level)}
                        className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${isSelected
                            ? `border-current shadow-sm`
                            : 'border-[#E5E5EA] bg-white hover:border-[#AEAEB2]'
                            }`}
                        style={{
                            borderColor: isSelected ? config.color : undefined,
                            background: isSelected ? config.bg : undefined,
                        }}
                    >
                        {/* Icon */}
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-transform duration-200"
                            style={{ background: config.bg }}
                        >
                            <Icon className="w-4.5 h-4.5" style={{ color: config.color }} />
                        </div>

                        {/* Label */}
                        <p className="text-[13px] text-[#1D1D1F] mb-0.5" style={{ fontFamily: SF, fontWeight: 600 }}>
                            {config.label}
                        </p>

                        {/* Distribution */}
                        <p className="text-[10px] text-[#AEAEB2] text-center leading-tight">
                            {config.description}
                        </p>

                        {/* Selected check */}
                        {isSelected && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ background: config.color }}
                            >
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </motion.div>
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
}
