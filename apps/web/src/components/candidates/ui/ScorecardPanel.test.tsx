import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IScorecardListItem } from '@/types/interfaces/evaluation.interface';
import type { IInterviewSchedule } from '@/types/interfaces/interview.interface';
import { ScorecardPanel } from './ScorecardPanel';

const mocks = vi.hoisted(() => ({ schedules: vi.fn(), scorecards: vi.fn(), submit: vi.fn() }));
vi.mock('@/servers/interviews/interviews.action', () => ({ getMyInterviewSchedulesAction: mocks.schedules }));
vi.mock('@/servers/scorecards/scorecards.action', () => ({
  getApplicationScorecardsAction: mocks.scorecards,
  submitScorecardAction: mocks.submit,
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const applicationId = 'app-1';
const currentUserId = 'user-1';
const savedComment = 'Có thể giải thích rõ các quyết định kỹ thuật.';

function schedule(overrides: Partial<IInterviewSchedule> = {}): IInterviewSchedule {
  return {
    interviewId: 'int-1',
    applicationId,
    interviewerId: currentUserId,
    scheduledBy: currentUserId,
    interviewType: 'onsite',
    startAt: '2026-10-10T02:00:00.000Z',
    durationMinutes: 60,
    location: 'Phòng phỏng vấn A',
    onlineMeetingLink: null,
    status: 'completed',
    application: { applicationId, jobId: 'job-1', cvId: 'cv-1', status: 'interview' },
    interviewer: { userId: currentUserId, fullName: 'Trần Thị B', email: 'b@ats.test' },
    scheduler: { userId: currentUserId, fullName: 'Trần Thị B', email: 'b@ats.test' },
    ...overrides,
  };
}

function scorecard(interview: IInterviewSchedule): IScorecardListItem {
  return {
    id: `score-${interview.interviewId}`,
    interviewId: interview.interviewId,
    technicalSkills: 4,
    problemSolving: 3,
    communication: 5,
    cultureFit: 2,
    recommendation: 'yes',
    comment: savedComment,
    submittedAt: '2026-10-10T03:00:00.000Z',
    updatedAt: '2026-10-10T03:00:00.000Z',
    author: { userId: interview.interviewerId, fullName: interview.interviewer.fullName },
    interview: {
      interviewId: interview.interviewId,
      startAt: interview.startAt,
      interviewType: interview.interviewType,
      status: interview.status,
    },
  };
}

function load(schedules: IInterviewSchedule[], scorecards: IScorecardListItem[]) {
  mocks.schedules.mockResolvedValue({
    items: schedules,
    pagination: { page: 1, limit: 20, total: schedules.length, totalPages: 1 },
  });
  mocks.scorecards.mockResolvedValue(scorecards);
}

function expectSavedScorecard(card: HTMLElement, saved: IScorecardListItem) {
  expect(card).toHaveTextContent(/Kỹ năng chuyên môn\s*:?\s*4/);
  expect(card).toHaveTextContent(/Giải quyết vấn đề\s*:?\s*3/);
  expect(card).toHaveTextContent(/Giao tiếp\s*:?\s*5/);
  expect(card).toHaveTextContent(/Phù hợp văn hoá\s*:?\s*2/);
  expect(within(card).getByText('Nên tuyển')).toBeVisible();
  expect(within(card).getByText(savedComment)).toBeVisible();
  expect(card).toHaveTextContent(saved.author.fullName);
  expect(within(card).queryByRole('radiogroup')).not.toBeInTheDocument();
  expect(within(card).queryByRole('textbox')).not.toBeInTheDocument();
}

beforeEach(() => {
  mocks.schedules.mockReset();
  mocks.scorecards.mockReset();
  mocks.submit.mockReset();
});

describe('ScorecardPanel', () => {
  it('ScorecardPanel offers "Nộp đánh giá" only on a completed interview where I am the interviewer and none exists yet', async () => {
    const mine = schedule();
    // I scheduled the other interview, which does not make me its interviewer.
    const other = schedule({
      interviewerId: 'user-2',
      interviewer: { userId: 'user-2', fullName: 'Lê Văn C', email: 'c@ats.test' },
    });
    const cases = [
      { interview: mine, existing: false, canSubmit: true, canEdit: false },
      { interview: schedule({ status: 'scheduled' }), existing: false, canSubmit: false, canEdit: false },
      { interview: other, existing: false, canSubmit: false, canEdit: false },
      { interview: mine, existing: true, canSubmit: false, canEdit: true },
      { interview: other, existing: true, canSubmit: false, canEdit: false },
      { interview: schedule({ status: 'cancelled' }), existing: false, canSubmit: false, canEdit: false },
    ];

    for (const testCase of cases) {
      const saved = scorecard(testCase.interview);
      load([testCase.interview], testCase.existing ? [saved] : []);
      const panel = render(<ScorecardPanel applicationId={applicationId} currentUserId={currentUserId} isClosed={false} />);
      const cards = await screen.findAllByRole('article');
      expect(cards).toHaveLength(1);
      const card = within(cards[0]);
      expect(mocks.schedules).toHaveBeenCalledWith({ applicationId });
      expect(mocks.scorecards).toHaveBeenCalledWith(applicationId);
      if (testCase.canSubmit) expect(card.getByRole('button', { name: 'Nộp đánh giá' })).toBeEnabled();
      else expect(card.queryByRole('button', { name: 'Nộp đánh giá' })).not.toBeInTheDocument();
      if (testCase.canEdit) expect(card.getByRole('button', { name: 'Sửa đánh giá' })).toBeEnabled();
      else expect(card.queryByRole('button', { name: 'Sửa đánh giá' })).not.toBeInTheDocument();
      if (testCase.existing) expectSavedScorecard(cards[0], saved);
      panel.unmount();
    }
  });

  it('ScorecardPanel is read-only when the application is closed', async () => {
    const completed = schedule();
    const withoutScorecard = schedule({ interviewId: 'int-2', startAt: '2026-10-11T02:00:00.000Z' });
    const saved = scorecard(completed);
    load([completed, withoutScorecard], [saved]);
    render(<ScorecardPanel applicationId={applicationId} currentUserId={currentUserId} isClosed />);

    expect(await screen.findByText(savedComment)).toBeVisible();
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(2);
    const savedCard = cards.find(card => within(card).queryByText(savedComment));
    if (!savedCard) throw new Error('The saved scorecard must appear on a schedule card');
    expectSavedScorecard(savedCard, saved);
    expect(screen.getByText(/Đơn đã chốt.*(chỉ.*xem|chỉ.*đọc)/i)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Nộp đánh giá' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sửa đánh giá' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(mocks.submit).not.toHaveBeenCalled();
  });
});
