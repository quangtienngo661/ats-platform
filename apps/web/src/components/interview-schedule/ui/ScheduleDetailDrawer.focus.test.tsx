import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { IInterviewSchedule } from '@/types/interfaces/interview.interface';
import { ScheduleCard } from './ScheduleCard';
import { ScheduleDetailDrawer } from './ScheduleDetailDrawer';

vi.mock('@/servers/interviews/interviews.action', () => ({
    cancelInterviewScheduleAction: vi.fn(),
    completeInterviewScheduleAction: vi.fn(),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const value = {
    interviewId: 'int-1',
    applicationId: 'app-1',
    interviewerId: 'user-2',
    scheduledBy: 'user-2',
    interviewType: 'onsite',
    startAt: '2026-10-05T02:00:00.000Z',
    durationMinutes: 60,
    onlineMeetingLink: null,
    location: 'Tầng 5',
    status: 'scheduled',
    application: {
        candidate: { user: { fullName: 'Nguyễn Văn A', email: 'a@ats.test' } },
        jobPosting: { jobId: 'job-1', title: 'Backend Engineer' },
    },
    interviewer: { fullName: 'Trần Thị B' },
} as unknown as IInterviewSchedule;

function Harness() {
    const [selected, setSelected] = useState<IInterviewSchedule | null>(null);
    return (
        <>
            <ScheduleCard schedule={value} onSelect={setSelected} />
            {selected && (
                <ScheduleDetailDrawer
                    schedule={selected}
                    currentUserId="user-2"
                    onClose={() => setSelected(null)}
                    onChanged={vi.fn()}
                    onReschedule={vi.fn()}
                />
            )}
        </>
    );
}

describe('ScheduleDetailDrawer focus', () => {
    it('returns focus to the card that opened it when it closes', async () => {
        const user = userEvent.setup();
        render(<Harness />);
        const card = screen.getByRole('button', { name: /Nguyễn Văn A/ });
        await user.click(card);
        expect(await screen.findByRole('dialog', { name: 'Chi tiết phỏng vấn' })).toBeInTheDocument();

        await user.keyboard('{Escape}');

        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        await waitFor(() => expect(card).toHaveFocus());
    });
});
