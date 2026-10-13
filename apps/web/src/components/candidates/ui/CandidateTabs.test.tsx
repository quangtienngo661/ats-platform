import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import CandidateDetailClient from '../CandidateDetailClient';
import { CandidateTabs } from './CandidateTabs';

const mocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => mocks.searchParams,
  usePathname: () => '/jobs/job-1/candidates/app-1',
  useRouter: () => ({ push: mocks.push, replace: mocks.replace, refresh: mocks.refresh }),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('./ScorecardPanel', () => ({
  ScorecardPanel: () => <section aria-label="Nội dung đánh giá">Các buổi phỏng vấn</section>,
}));
vi.mock('./NotesPanel', () => ({
  NotesPanel: () => <section aria-label="Nội dung ghi chú">Danh sách ghi chú</section>,
}));

const tabs: { id: 'overview' | 'evaluation' | 'notes'; label: string }[] = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'evaluation', label: 'Đánh giá phỏng vấn' },
  { id: 'notes', label: 'Ghi chú' },
];
const application: IApplicationDto = {
  applicationId: 'app-1',
  jobId: 'job-1',
  cvId: 'cv-1',
  status: 'interview',
  appliedAt: '2026-10-01T02:00:00.000Z',
  screening: null,
};
const detailProps = { application, jobId: 'job-1', currentUserId: 'user-1', isClosed: false };

beforeEach(() => {
  mocks.searchParams = new URLSearchParams();
});

describe('CandidateTabs', () => {
  it('CandidateTabs switches the content and honours ?tab=evaluation', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const standalone = render(<CandidateTabs tabs={tabs} active="overview" onChange={onChange} />);
    const tablist = within(screen.getByRole('tablist'));
    expect(tablist.getAllByRole('tab')).toHaveLength(3);
    expect(tablist.getByRole('tab', { name: 'Tổng quan' })).toHaveAttribute('aria-selected', 'true');
    expect(tablist.getByRole('tab', { name: 'Đánh giá phỏng vấn' })).toHaveAttribute('aria-selected', 'false');
    expect(tablist.getByRole('tab', { name: 'Ghi chú' })).toHaveAttribute('aria-selected', 'false');
    await user.click(tablist.getByRole('tab', { name: 'Đánh giá phỏng vấn' }));
    expect(onChange).toHaveBeenCalledWith('evaluation');
    standalone.unmount();

    for (const [query, initial] of [
      ['tab=evaluation', 'evaluation'],
      ['tab=notes', 'notes'],
      ['', 'overview'],
      ['tab=unknown', 'overview'],
    ] as const) {
      mocks.searchParams = new URLSearchParams(query);
      const detail = render(<CandidateDetailClient {...detailProps} />);

      function expectContent(active: 'overview' | 'evaluation' | 'notes') {
        const bar = within(screen.getByRole('tablist'));
        for (const tab of tabs) {
          expect(bar.getByRole('tab', { name: tab.label }))
            .toHaveAttribute('aria-selected', String(tab.id === active));
        }
        if (active === 'overview') {
          expect(screen.getByRole('heading', { name: 'Thông tin ứng tuyển' })).toBeVisible();
        } else {
          expect(screen.queryByRole('heading', { name: 'Thông tin ứng tuyển' })).not.toBeInTheDocument();
        }
        for (const [id, label] of [
          ['evaluation', 'Nội dung đánh giá'],
          ['notes', 'Nội dung ghi chú'],
        ] as const) {
          if (active === id) expect(screen.getByRole('region', { name: label })).toBeVisible();
          else expect(screen.queryByRole('region', { name: label })).not.toBeInTheDocument();
        }
      }

      expectContent(initial);
      for (const tab of [tabs[2], tabs[0], tabs[1]]) {
        await user.click(screen.getByRole('tab', { name: tab.label }));
        expectContent(tab.id);
      }
      detail.unmount();
    }
  });
});
