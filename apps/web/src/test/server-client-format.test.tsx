// Client components render once on the server (Docker: TZ=UTC, default locale en-US) and again in the
// browser (Vietnam time, vi-VN). A date or number formatted with the process defaults differs between the
// two, React throws "Hydration failed … tree will be regenerated" and discards the server HTML.
// Task 33 saw this in the browser on /my-applications, /mock-interview, the mock interview result,
// the recruiter candidate detail and /ai-usage-logs. Each component must pin vi-VN and Asia/Ho_Chi_Minh.
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IApplicationCard, IApplicationDto } from '@/types/interfaces/application.interface';
import type { IAiUsageLogDto } from '@/types/interfaces/ai-usage-log.interface';
import type { IInterviewResult, ISessionSummary } from '@/types/interfaces/interview.interface';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/my-applications/ui/WithdrawApplicationForm', () => ({ WithdrawApplicationForm: () => null }));

const originalTz = process.env.TZ;
// 18:30 UTC on 13/11 is 01:30 on 14/11 in Vietnam: the server (UTC) and the browser disagree on the day.
const AT = '2026-11-13T18:30:00.000Z';

beforeEach(() => {
  process.env.TZ = 'UTC';
  vi.resetModules();
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: true, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
});

afterEach(() => {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe('dates render in Vietnam time whatever the server time zone', { timeout: 30_000 }, () => {
  it('ApplicationCard shows the applied day in Vietnam', async () => {
    const { ApplicationCard } = await import('@/components/my-applications/ui/ApplicationCard');
    const application = { applicationId: 'a-1', status: 'applied', jobTitle: 'Backend', appliedAt: AT } as IApplicationCard;
    render(<ApplicationCard application={application} onWithdrawSuccess={vi.fn()} />);
    expect(screen.getByText('Nộp 14/11/2026')).toBeInTheDocument();
  });

  it('SessionCard shows the session day in Vietnam', async () => {
    const { SessionCard } = await import('@/components/mock-interview/ui/SessionCard');
    const session: ISessionSummary = {
      sessionId: 's-1', status: 'completed', difficultyLevel: 'medium', startedAt: AT,
      topic: { name: 'React', categoryId: null, category: null }, result: { overallScore: 70 },
    };
    render(<SessionCard session={session} />);
    expect(screen.getByText('14/11/2026')).toBeInTheDocument();
  });

  it('InterviewResultClient shows the result day in Vietnam', async () => {
    const { default: InterviewResultClient } = await import('@/components/mock-interview/InterviewResultClient');
    const result = {
      resultId: 'r-1', sessionId: 's-1', overallScore: 70, strengths: [], weaknesses: [], actionPlan: '', generatedAt: AT,
      session: {
        sessionId: 's-1', candidateId: 'c-1', topicId: 't-1', difficultyLevel: 'medium', status: 'completed', startedAt: AT,
        topic: { topicId: 't-1', name: 'React', categoryId: null, category: null }, qnas: [],
      },
    } as unknown as IInterviewResult;
    render(<InterviewResultClient result={result} />);
    expect(screen.getByText('14/11/2026')).toBeInTheDocument();
  });

  it('CandidateOverviewTab shows the applied day in Vietnam', async () => {
    const { CandidateOverviewTab } = await import('@/components/candidates/ui/CandidateOverviewTab');
    const application = { applicationId: 'a-1', status: 'screening', appliedAt: AT, jobPosting: { title: 'Backend' } } as unknown as IApplicationDto;
    render(<CandidateOverviewTab application={application} />);
    expect(screen.getByText('14/11/2026')).toBeInTheDocument();
  });

  it('AiUsageLogsTable shows the log time and day in Vietnam', async () => {
    const { AiUsageLogsTable } = await import('@/components/ai-usage-logs/ui/AiUsageLogsTable');
    const log: IAiUsageLogDto = {
      logId: 'l-1', actionType: 'cv_scoring', referenceId: null, modelName: 'gemini', promptTokens: 1, completionTokens: 1,
      durationMs: 10, status: 'success', createdAt: AT,
    } as IAiUsageLogDto;
    render(<AiUsageLogsTable logs={[log]} pagination={{ page: 1, limit: 20, total: 1, totalPages: 1 }} />);
    expect(screen.getByText('01:30')).toBeInTheDocument();
    expect(screen.getByText('14/11/2026')).toBeInTheDocument();
  });
});

describe('token counts use vi-VN grouping whatever the server locale', { timeout: 30_000 }, () => {
  const log = (promptTokens: number, completionTokens: number) => ({
    logId: `l-${promptTokens}`, actionType: 'cv_scoring', referenceId: null, modelName: 'gemini', promptTokens, completionTokens,
    durationMs: 10, status: 'success', createdAt: AT,
  }) as IAiUsageLogDto;

  it('AiUsageLogsStats groups thousands with a dot', async () => {
    const { AiUsageLogsStats } = await import('@/components/ai-usage-logs/ui/AiUsageLogsStats');
    render(<AiUsageLogsStats logs={[log(20_000, 3_010)]} />);
    expect(screen.getByText('23.010')).toBeInTheDocument();
  });

  it('AiUsageLogsTable groups total, prompt and completion tokens with a dot', async () => {
    const { AiUsageLogsTable } = await import('@/components/ai-usage-logs/ui/AiUsageLogsTable');
    render(<AiUsageLogsTable logs={[log(20_000, 3_010)]} pagination={{ page: 1, limit: 20, total: 1, totalPages: 1 }} />);
    expect(screen.getByText('23.010')).toBeInTheDocument();
    expect(screen.getByText('↑ 20.000')).toBeInTheDocument();
    expect(screen.getByText('↓ 3.010')).toBeInTheDocument();
  });
});
