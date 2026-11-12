// Component behaviour: what a candidate sees for each kind of schedule, in the browser's
// timezone (Vietnam here), with the clock pinned to 2026-10-05 10:00 Vietnam time.
import { render, screen, within } from '@testing-library/react';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICandidateInterviewSchedule } from '@/types/interfaces/interview.interface';
import { candidateSchedule } from '@/test/fixtures/candidate-schedule';
import { MyInterviewsClient } from './MyInterviewsClient';

const originalTz = process.env.TZ;
process.env.TZ = 'Asia/Ho_Chi_Minh';

afterAll(() => {
  process.env.TZ = originalTz;
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-05T03:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

function job(title: string, organization = 'Công ty Alpha') {
  return { applicationId: `app-${title}`, jobPosting: { jobId: `job-${title}`, title, organization: { name: organization } } };
}

function renderPage(
  upcoming: ICandidateInterviewSchedule[],
  history: ICandidateInterviewSchedule[] = [],
  historyPage = 1,
  historyTotalPages = 1,
) {
  return render(
    <MyInterviewsClient
      upcoming={upcoming}
      history={history}
      historyPage={historyPage}
      historyTotalPages={historyTotalPages}
    />,
  );
}

const upcomingGroup = () => screen.getByRole('region', { name: 'Sắp tới' });
const pastGroup = () => screen.getByRole('region', { name: 'Đã qua & đã hủy' });
const card = (title: string) => screen.getByRole('article', { name: title });

describe('MyInterviewsClient (C5)', () => {
  it('shows the upcoming and past groups with what the candidate needs to attend', () => {
    renderPage(
      [candidateSchedule({ interviewId: 'online', application: job('Backend Engineer') })],
      [
        candidateSchedule({
          interviewId: 'onsite',
          startAt: '2026-10-01T02:00:00.000Z',
          status: 'completed',
          interviewType: 'onsite',
          onlineMeetingLink: null,
          location: 'Tầng 5, 123 Lê Lợi, Q.1',
          application: job('Data Analyst', 'Công ty Beta'),
        }),
      ],
    );

    const online = within(upcomingGroup()).getByRole('article', { name: 'Backend Engineer' });
    expect(within(online).getByText('Công ty Alpha')).toBeInTheDocument();
    expect(within(online).getByText('Trần Thị B')).toBeInTheDocument();
    expect(within(online).getByText('09:00')).toBeInTheDocument();
    expect(within(online).getByText('60 phút')).toBeInTheDocument();
    expect(within(online).getByText('Trực tuyến')).toBeInTheDocument();
    const link = within(online).getByRole('link', { name: 'Tham gia phòng họp' });
    expect(link).toHaveAttribute('href', 'https://meet.example.com/abc-defg-hij');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    const onsite = within(pastGroup()).getByRole('article', { name: 'Data Analyst' });
    expect(within(onsite).getByText('Trực tiếp')).toBeInTheDocument();
    expect(within(onsite).getByText('Tầng 5, 123 Lê Lợi, Q.1')).toBeInTheDocument();
    expect(within(onsite).getByText('Hoàn thành')).toBeInTheDocument();
  });

  it('tells the candidate the address will follow when an onsite interview has none (E2)', () => {
    renderPage([
      candidateSchedule({ interviewType: 'onsite', onlineMeetingLink: null, location: null, application: job('QA Engineer') }),
    ]);
    expect(within(card('QA Engineer')).getByText('Nhà tuyển dụng sẽ gửi địa điểm')).toBeInTheDocument();
  });

  it('files a cancelled interview under past, labelled and without its link (E3)', () => {
    renderPage([], [candidateSchedule({ status: 'cancelled', application: job('DevOps Engineer') })]);
    const cancelled = within(pastGroup()).getByRole('article', { name: 'DevOps Engineer' });
    expect(within(cancelled).getByText('Đã hủy')).toBeInTheDocument();
    expect(within(cancelled).queryByRole('link')).toBeNull();
  });

  it('labels a still-scheduled interview whose time has passed as held, not completed (E9)', () => {
    renderPage([candidateSchedule({ startAt: '2026-10-04T02:00:00.000Z', application: job('Mobile Engineer') })]);
    const held = within(pastGroup()).getByRole('article', { name: 'Mobile Engineer' });
    expect(within(held).getByText('Đã diễn ra')).toBeInTheDocument();
    expect(within(held).queryByText('Hoàn thành')).toBeNull();
  });

  it('keeps a running interview upcoming, labelled and joinable (E8)', () => {
    renderPage([candidateSchedule({ startAt: '2026-10-05T02:30:00.000Z', application: job('Frontend Engineer') })]);
    const running = within(upcomingGroup()).getByRole('article', { name: 'Frontend Engineer' });
    expect(within(running).getByText('Đang diễn ra')).toBeInTheDocument();
    expect(within(running).getByRole('link', { name: 'Tham gia phòng họp' })).toBeInTheDocument();
  });

  it('shows a non-http(s) meeting link as plain text, never as a link (E10)', () => {
    renderPage([candidateSchedule({ onlineMeetingLink: 'javascript:alert(1)', application: job('Security Engineer') })]);
    const unsafe = card('Security Engineer');
    expect(within(unsafe).getByText('javascript:alert(1)')).toBeInTheDocument();
    expect(within(unsafe).queryByRole('link')).toBeNull();
  });

  it('shows both interviews when two organisations booked the same time (E11)', () => {
    renderPage([
      candidateSchedule({ interviewId: 'alpha', application: job('Backend Engineer', 'Công ty Alpha') }),
      candidateSchedule({ interviewId: 'beta', application: job('Platform Engineer', 'Công ty Beta') }),
    ]);
    expect(within(upcomingGroup()).getAllByRole('article')).toHaveLength(2);
    expect(within(card('Platform Engineer')).getByText('Công ty Beta')).toBeInTheDocument();
  });

  it('explains the empty page to a candidate with no interviews (E1)', () => {
    renderPage([], []);
    expect(screen.getByText('Bạn chưa có lịch phỏng vấn nào')).toBeInTheDocument();
    expect(screen.queryByRole('article')).toBeNull();
  });

  it('offers the next history page while there is one', () => {
    const past = candidateSchedule({ startAt: '2026-09-01T02:00:00.000Z', application: job('Tester') });
    const { unmount } = renderPage([], [past], 1, 2);
    expect(screen.getByRole('link', { name: 'Xem thêm' })).toHaveAttribute('href', '/my-interviews?page=2');
    unmount();

    renderPage([], [past], 2, 2);
    expect(screen.queryByRole('link', { name: 'Xem thêm' })).toBeNull();
  });
});
