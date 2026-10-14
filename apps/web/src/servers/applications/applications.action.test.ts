// @vitest-environment node
// C9: the web reads application history in the shape the API sends. The old
// `historyId`/`status` type matched nothing the API returns; typecheck guards the rest.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScreeningSkipReason, type IBulkScreeningResult } from '@ats-platform/types';
import { revalidatePath } from 'next/cache';
import type { IApplicationHistoryItem } from '@/types/interfaces/application.interface';
import {
  bulkScreenApplicationsAction,
  exportCandidatesCsvAction,
  getApplicationByIdAction,
  getApplicationHistoryAction,
} from './applications.action';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: { get: mocks.get, post: mocks.post, patch: vi.fn() } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const apiHistory: IApplicationHistoryItem[] = [
  { id: 'h1', fromStatus: null, toStatus: 'applied', changedAt: '2026-10-01T02:12:00.000Z' },
  { id: 'h2', fromStatus: 'applied', toStatus: 'rejected', changedAt: '2026-10-04T03:30:00.000Z', rejectionReason: 'Thiếu NestJS' },
];

describe('application history actions (C9)', () => {
  it('reads the history of one application in the API shape', async () => {
    mocks.get.mockResolvedValueOnce({ data: apiHistory });

    const history = await getApplicationHistoryAction('app-1');

    expect(mocks.get).toHaveBeenCalledWith('/applications/app-1/history');
    expect(history.map((item) => [item.fromStatus, item.toStatus, item.rejectionReason])).toEqual([
      [null, 'applied', undefined],
      ['applied', 'rejected', 'Thiếu NestJS'],
    ]);
  });

  it('keeps the history inside the application it reads', async () => {
    mocks.get.mockResolvedValueOnce({
      data: { applicationId: 'app-1', status: 'rejected', appliedAt: '2026-10-01T02:12:00.000Z', history: apiHistory },
    });

    const application = await getApplicationByIdAction('app-1');

    expect(mocks.get).toHaveBeenCalledWith('/applications/app-1');
    expect(application.history?.map((item) => item.id)).toEqual(['h1', 'h2']);
  });
});

describe('bulk screening and CSV export actions', () => {
  const jobId = '12345678-1234-4abc-8def-1234567890ab';
  const screeningResult: IBulkScreeningResult = {
    queued: [
      { applicationId: 'app-1', movedToScreening: true },
      { applicationId: 'app-2', movedToScreening: false },
    ],
    skipped: [
      { applicationId: 'app-3', reason: ScreeningSkipReason.ALREADY_SCREENED, movedToScreening: false },
    ],
    remaining: 3,
  };

  beforeEach(() => {
    mocks.get.mockReset();
    mocks.post.mockReset();
    vi.mocked(revalidatePath).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('bulkScreenApplicationsAction posts the ids, the flag and the config', async () => {
    const applicationIds = ['app-1', 'app-2', 'app-3'];
    mocks.post.mockResolvedValueOnce({ data: screeningResult });

    const result = await bulkScreenApplicationsAction(jobId, {
      applicationIds,
      moveAppliedToScreening: true,
      configId: 'config-1',
    });

    expect(mocks.post.mock.calls).toStrictEqual([
      [`/applications/job/${jobId}/bulk-screening`, {
        applicationIds,
        moveAppliedToScreening: true,
        configId: 'config-1',
      }],
    ]);
    expect(revalidatePath).toHaveBeenCalledWith(`/jobs/${jobId}/candidates`);
    expect(result).toEqual({
      success: true,
      message: 'Đã đưa 2 đơn vào hàng đợi',
      data: screeningResult,
    });
  });

  it('sends no applicationIds in auto mode', async () => {
    mocks.post.mockResolvedValueOnce({ data: screeningResult });

    await bulkScreenApplicationsAction(jobId, { moveAppliedToScreening: false });

    expect(mocks.post.mock.calls).toStrictEqual([
      [`/applications/job/${jobId}/bulk-screening`, { moveAppliedToScreening: false }],
    ]);
  });

  it('explains a 429 in Vietnamese', async () => {
    mocks.post.mockRejectedValueOnce({
      response: { status: 429, data: { message: 'ThrottlerException: Too Many Requests' } },
    });

    const result = await bulkScreenApplicationsAction(jobId, { moveAppliedToScreening: false });

    expect(result).toEqual({
      success: false,
      message: 'Bạn vừa gửi quá nhiều yêu cầu chấm hàng loạt. Vui lòng thử lại sau một phút.',
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('exportCandidatesCsvAction reads the CSV as text and names the file', async () => {
    vi.stubEnv('TZ', 'UTC');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-13T20:00:00.000Z'));
    const csv = '"Tên ứng viên","Trạng thái"\r\n"Nguyễn An","Sàng lọc"\r\n';
    mocks.get.mockResolvedValueOnce(csv);

    const result = await exportCandidatesCsvAction(jobId);

    expect(mocks.get).toHaveBeenCalledWith(`/applications/job/${jobId}/export`, { responseType: 'text' });
    expect(result).toEqual({
      success: true,
      csv,
      filename: `ung-vien-${jobId.slice(0, 8)}-20261014.csv`,
    });
    if (!result.success) throw new Error(result.message);
    expect(result.filename).toMatch(/^ung-vien-[0-9a-f-]{8}-\d{8}\.csv$/);
    expect(result.filename.startsWith(`ung-vien-${jobId.slice(0, 8)}-`)).toBe(true);
  });

  it('shows the API message of a 400 whose body arrived as text', async () => {
    mocks.get.mockRejectedValueOnce({
      response: {
        status: 400,
        data: JSON.stringify({
          success: false,
          status: 400,
          message: 'Tin có quá nhiều đơn để xuất CSV (tối đa 5000)',
        }),
      },
    });

    const result = await exportCandidatesCsvAction(jobId);

    expect(result).toEqual({
      success: false,
      message: 'Tin có quá nhiều đơn để xuất CSV (tối đa 5000)',
    });
  });
});
