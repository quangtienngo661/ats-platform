// Component behaviour only: what a recruiter reads on one calendar card.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { IInterviewSchedule } from '@/types/interfaces/interview.interface';
import { ScheduleCard } from './ScheduleCard';

function schedule(overrides: Partial<IInterviewSchedule> = {}): IInterviewSchedule {
    return {
        interviewId: 'iv-1',
        applicationId: 'app-1',
        scheduledBy: 'u-1',
        interviewerId: 'u-2',
        interviewType: 'online',
        startAt: '2026-10-05T07:00:00.000Z',
        durationMinutes: 45,
        onlineMeetingLink: 'https://meet.example.com/abc',
        location: null,
        status: 'scheduled',
        application: {
            candidate: { user: { fullName: 'Trần Ngọc Anh' } },
            jobPosting: { title: 'Backend Engineer' },
        },
        interviewer: { fullName: 'Lê Minh' },
        scheduler: { fullName: 'Phạm Hà' },
        ...overrides,
    } as unknown as IInterviewSchedule;
}

describe('ScheduleCard', () => {
    it('names the real interview type instead of a fixed label', () => {
        const { rerender } = render(<ScheduleCard schedule={schedule()} onSelect={vi.fn()} />);
        expect(screen.getByText('Trực tuyến')).toBeInTheDocument();
        expect(screen.queryByText('Offline')).not.toBeInTheDocument();

        rerender(<ScheduleCard schedule={schedule({ interviewType: 'onsite', location: 'Tầng 5' })} onSelect={vi.fn()} />);
        expect(screen.getByText('Trực tiếp')).toBeInTheDocument();
    });

    it('shows a status pill only for finished or cancelled interviews', () => {
        const { rerender } = render(<ScheduleCard schedule={schedule()} onSelect={vi.fn()} />);
        expect(screen.queryByText('Hoàn tất')).not.toBeInTheDocument();
        expect(screen.queryByText('Đã hủy')).not.toBeInTheDocument();

        rerender(<ScheduleCard schedule={schedule({ status: 'completed' })} onSelect={vi.fn()} />);
        expect(screen.getByText('Hoàn tất')).toBeInTheDocument();

        rerender(<ScheduleCard schedule={schedule({ status: 'cancelled' })} onSelect={vi.fn()} />);
        expect(screen.getByText('Đã hủy')).toBeInTheDocument();
    });

    it('reports the clicked schedule', async () => {
        const onSelect = vi.fn();
        const value = schedule();
        render(<ScheduleCard schedule={value} onSelect={onSelect} />);
        await userEvent.click(screen.getByRole('button'));
        expect(onSelect).toHaveBeenCalledWith(value);
    });
});
