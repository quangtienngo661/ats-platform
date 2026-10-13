// The server page's two requests (C19): the upcoming list is never cut off by the
// history page size, and "Xem thêm" grows the history instead of replacing it.
import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICandidateInterviewSchedule } from '@/types/interfaces/interview.interface';
import { getCandidateInterviewSchedulesAction } from '@/servers/interviews/interviews.action';
import { candidateSchedule } from '@/test/fixtures/candidate-schedule';
import MyInterviewsPage from './page';

vi.mock('@/servers/interviews/interviews.action', () => ({
  getCandidateInterviewSchedulesAction: vi.fn(),
}));

const fetchSchedules = vi.mocked(getCandidateInterviewSchedulesAction);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-05T03:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

function page(items: ICandidateInterviewSchedule[], total: number, limit: number) {
  return { items, pagination: { page: 1, limit, total, totalPages: Math.ceil(total / limit) } };
}

const upcoming = [1, 2, 3].map((day) =>
  candidateSchedule({ interviewId: `next-${day}`, startAt: `2026-10-0${5 + day}T02:00:00.000Z` }),
);
const past = Array.from({ length: 22 }, (_, index) =>
  candidateSchedule({ interviewId: `past-${index}`, startAt: new Date(Date.UTC(2026, 8, 30 - index, 2)).toISOString() }),
);

async function renderPage(searchParams: Record<string, string> = {}) {
  render(await MyInterviewsPage({ searchParams: Promise.resolve(searchParams) }));
}

describe('MyInterviewsPage (C19)', () => {
  it('shows all three upcoming interviews when the latest twenty already fill the history', async () => {
    fetchSchedules.mockImplementation(async (query) =>
      query?.status === 'scheduled'
        ? page(upcoming, 3, 50)
        : page([...upcoming].reverse().concat(past.slice(0, 17)), 25, 20),
    );

    await renderPage();

    expect(fetchSchedules).toHaveBeenCalledWith({ status: 'scheduled', fromDate: '2026-10-04', order: 'asc', limit: 50 });
    expect(fetchSchedules).toHaveBeenCalledWith({ order: 'desc', page: 1, limit: 20 });
    expect(within(screen.getByRole('region', { name: 'Sắp tới' })).getAllByRole('article')).toHaveLength(3);
    expect(within(screen.getByRole('region', { name: 'Đã qua & đã hủy' })).getAllByRole('article')).toHaveLength(17);
    expect(screen.getByRole('link', { name: 'Xem thêm' })).toHaveAttribute('href', '/my-interviews?page=2');
  });

  it('keeps the earlier history on screen when the candidate asks for more', async () => {
    fetchSchedules.mockImplementation(async (query) =>
      query?.status === 'scheduled'
        ? page(upcoming, 3, 50)
        : page([...upcoming].reverse().concat(past), 25, 40),
    );

    await renderPage({ page: '2' });

    expect(fetchSchedules).toHaveBeenCalledWith({ order: 'desc', page: 1, limit: 40 });
    expect(within(screen.getByRole('region', { name: 'Đã qua & đã hủy' })).getAllByRole('article')).toHaveLength(22);
    expect(screen.queryByRole('link', { name: 'Xem thêm' })).toBeNull();
  });

  it.each(['0', '-3', 'abc'])('treats page=%s as the first page', async (value) => {
    fetchSchedules.mockResolvedValue(page([], 0, 20));
    await renderPage({ page: value });
    expect(fetchSchedules).toHaveBeenCalledWith({ order: 'desc', page: 1, limit: 20 });
  });
});
