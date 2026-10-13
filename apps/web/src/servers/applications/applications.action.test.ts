// @vitest-environment node
// C9: the web reads application history in the shape the API sends. The old
// `historyId`/`status` type matched nothing the API returns; typecheck guards the rest.
import { describe, expect, it, vi } from 'vitest';
import { unstable_rethrow } from 'next/navigation';
import type { IApplicationHistoryItem } from '@/types/interfaces/application.interface';
import { compareApplicationsAction, getApplicationByIdAction, getApplicationHistoryAction } from './applications.action';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: { get: mocks.get, post: vi.fn(), patch: vi.fn() } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ unstable_rethrow: vi.fn() }));

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

describe('compareApplicationsAction', () => {
  it('compareApplicationsAction joins the ids with commas', async () => {
    const items = ['a', 'b', 'c'].map((applicationId) => ({
      applicationId,
      candidateName: `Ứng viên ${applicationId}`,
      status: 'interview',
      appliedAt: '2026-10-01T02:12:00.000Z',
      screening: null,
      scorecards: {
        count: 0,
        average: { technicalSkills: null, problemSolving: null, communication: null, cultureFit: null },
        recommendations: [],
      },
      noteCount: 0,
    }));
    mocks.get.mockResolvedValueOnce({ data: items });

    await expect(compareApplicationsAction('job-1', ['a', 'b', 'c'])).resolves.toEqual(items);
    expect(mocks.get).toHaveBeenCalledExactlyOnceWith('/applications/job/job-1/compare', {
      params: { applicationIds: 'a,b,c' },
    });
  });

  it('compareApplicationsAction rethrows with the standard message', async () => {
    const error = new Error('offline');
    mocks.get.mockRejectedValueOnce(error);
    const result = compareApplicationsAction('job-1', ['a', 'b']);

    await expect(result).rejects.toThrow('Không thể tải dữ liệu. Vui lòng thử lại.');
    await expect(result).rejects.toMatchObject({ cause: error });
    expect(unstable_rethrow).toHaveBeenCalledWith(error);
  });
});
