// The applied date is rendered on the server (UTC in Docker) and again in the browser (Vietnam time).
// If the formatter follows the process time zone the two disagree and React discards the server HTML.
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IApplicationDto } from '@/types/interfaces/application.interface';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/jobs/job-1/candidates/app-1',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const originalTz = process.env.TZ;

function appliedAt(at: string) {
  return {
    applicationId: 'app-1', jobId: 'job-1', cvId: 'cv-1', status: 'interview', appliedAt: at,
    candidate: { user: { fullName: 'Trần Thị Lan', email: 'lan@example.com' } },
    jobPosting: { title: 'Kỹ sư backend' },
  } as unknown as IApplicationDto;
}

/** Loads CandidateDetailClient fresh under the given process time zone. */
async function renderUnder(tz: string, at: string) {
  process.env.TZ = tz;
  vi.resetModules();
  const { default: CandidateDetailClient } = await import('./CandidateDetailClient');
  render(<CandidateDetailClient application={appliedAt(at)} jobId="job-1" currentUserId="user-1" isClosed={false} />);
}

describe('CandidateDetailClient applied date', () => {
  afterEach(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
    vi.resetModules();
  });

  it.each(['UTC', 'Asia/Ho_Chi_Minh', 'America/Los_Angeles'])(
    'shows 18:30 UTC on 13/11 as 14/11/2026 under TZ=%s',
    async (tz) => {
      await renderUnder(tz, '2026-11-13T18:30:00Z');
      expect(screen.getByText('Kỹ sư backend · Nộp ngày 14/11/2026')).toBeInTheDocument();
    },
  );

  it.each([
    ['2026-11-13T16:59:59Z', 'Kỹ sư backend · Nộp ngày 13/11/2026'],
    ['2026-11-13T17:00:00Z', 'Kỹ sư backend · Nộp ngày 14/11/2026'],
  ])('switches the day at Vietnam midnight: %s is %s', async (at, expected) => {
    await renderUnder('UTC', at);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
