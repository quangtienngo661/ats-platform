'use client';

import { motion } from 'motion/react';
import { Code2, Database, Server, Brain, Layers, Terminal } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IInterviewTopic } from '@/types/interfaces/interview.interface';

// Map category → icon + color để mỗi topic card có visual riêng
const categoryConfig: Record<string, { icon: typeof Code2; color: string; bg: string }> = {
    'Frontend Development': { icon: Code2, color: '#0071E3', bg: '#EBF3FD' },
    'Backend Development': { icon: Server, color: '#6366F1', bg: '#F5F3FF' },
    'Database': { icon: Database, color: '#34C759', bg: '#F0FDF4' },
    'Computer Science': { icon: Brain, color: '#F59E0B', bg: '#FFFBEB' },
    'Architecture': { icon: Layers, color: '#EC4899', bg: '#FDF2F8' },
    'Programming Language': { icon: Terminal, color: '#0EA5E9', bg: '#F0F9FF' },
};

const defaultConfig = { icon: Code2, color: '#6E6E73', bg: '#F5F5F7' };

interface TopicSelectorProps {
    topics: IInterviewTopic[];
    selectedId: string | null;
    onSelect: (topicId: string) => void;
}

export function TopicSelector({ topics, selectedId, onSelect }: TopicSelectorProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {topics.map((topic, index) => {
                const categoryName = topic.category?.name ?? '';
                const config = categoryConfig[categoryName] || defaultConfig;
                const Icon = config.icon;
                const isSelected = selectedId === topic.topicId;

                return (
                    <motion.button
                        key={topic.topicId}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03, duration: 0.2 }}
                        onClick={() => onSelect(topic.topicId)}
                        className={`relative flex flex-col items-start p-3.5 rounded-xl border-2 transition-all duration-200 text-left group ${isSelected
                            ? 'border-[#0071E3] bg-[#EBF3FD] shadow-sm shadow-[#0071E3]/10'
                            : 'border-[#E5E5EA] bg-white hover:border-[#AEAEB2] hover:shadow-sm'
                            }`}
                    >
                        {/* Icon */}
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 transition-transform duration-200 group-hover:scale-105"
                            style={{ background: config.bg }}
                        >
                            <Icon className="w-4 h-4" style={{ color: config.color }} />
                        </div>

                        {/* Name */}
                        <p className="text-[13px] text-[#1D1D1F] leading-tight mb-1" style={{ fontFamily: SF, fontWeight: 500 }}>
                            {topic.name}
                        </p>

                        {/* Category */}
                        <p className="text-[10px] text-[#AEAEB2]" style={{ fontFamily: SFT }}>
                            {categoryName}
                        </p>

                        {/* Session count badge */}
                        {topic._count && topic._count.sessions > 0 && (
                            <span className="absolute top-2.5 right-2.5 text-[9px] bg-[#F2F2F7] text-[#6E6E73] rounded-full px-1.5 py-0.5" style={{ fontWeight: 500 }}>
                                {topic._count.sessions} lần
                            </span>
                        )}

                        {/* Selected indicator */}
                        {isSelected && (
                            <motion.div
                                layoutId="topic-selected"
                                className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#0071E3] rounded-full flex items-center justify-center"
                            >
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
