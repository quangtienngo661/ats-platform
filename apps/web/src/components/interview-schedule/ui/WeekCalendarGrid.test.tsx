import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { WorkDay } from '../InterviewScheduleClient';
import { WeekCalendarGrid } from './WeekCalendarGrid';

const LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];
const weekDays: WorkDay[] = LABELS.map((label, i) => {
    const date = new Date(2026, 10, 16 + i);
    return { date, dateKey: `2026-11-${16 + i}`, label, shortLabel: `${16 + i}/11` };
});

describe('WeekCalendarGrid', () => {
    it('names each day column as a group, not as five page landmarks', () => {
        render(<WeekCalendarGrid weekDays={weekDays} schedulesByDate={{}} today="2026-11-18" onSelectSchedule={vi.fn()} />);

        expect(screen.queryAllByRole('region')).toEqual([]);
        expect(screen.getAllByRole('group').map((day) => day.getAttribute('aria-label'))).toEqual([
            'Thứ 2, 16/11',
            'Thứ 3, 17/11',
            'Thứ 4, 18/11',
            'Thứ 5, 19/11',
            'Thứ 6, 20/11',
        ]);
        expect(within(screen.getByRole('group', { name: 'Thứ 4, 18/11' })).getByText('Hôm nay')).toBeVisible();
    });
});
