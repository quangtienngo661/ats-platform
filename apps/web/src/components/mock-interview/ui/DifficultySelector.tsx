'use client';

import { Segmented } from '@/components/ui';
import type { DifficultyLevel } from '@ats-platform/types';

export const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string; mix: string }[] = [
    { value: 'easy', label: 'Dễ', mix: '6 dễ · 3 trung bình · 1 khó' },
    { value: 'medium', label: 'Trung bình', mix: '2 dễ · 5 trung bình · 3 khó' },
    { value: 'hard', label: 'Khó', mix: '1 dễ · 3 trung bình · 6 khó' },
];

interface DifficultySelectorProps {
    selected: DifficultyLevel;
    onSelect: (difficulty: DifficultyLevel) => void;
}

export function DifficultySelector({ selected, onSelect }: DifficultySelectorProps) {
    const current = DIFFICULTY_OPTIONS.find((o) => o.value === selected) ?? DIFFICULTY_OPTIONS[1];
    return (
        <div className="flex flex-col gap-2">
            <div>
                <Segmented
                    label="Độ khó"
                    options={DIFFICULTY_OPTIONS.map(({ value, label }) => ({ value, label }))}
                    value={selected}
                    onValueChange={(v) => onSelect(v as DifficultyLevel)}
                />
            </div>
            <p className="text-body-sm text-ink-3">10 câu: {current.mix}</p>
        </div>
    );
}
