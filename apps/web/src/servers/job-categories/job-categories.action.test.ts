// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getViewerJobCategoriesAction } from './job-categories.action';

const mocks = vi.hoisted(() => ({ get: vi.fn(), cookie: vi.fn(), decode: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: { get: mocks.get } }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: mocks.cookie }) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/decodeTokenPayload', () => ({ decodeTokenPayload: mocks.decode }));

describe('public category choices respect the existing staff-only API', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('does not redirect guests by calling a protected endpoint', async () => {
        mocks.cookie.mockReturnValue(undefined);
        expect(await getViewerJobCategoriesAction()).toEqual([]);
        expect(mocks.get).not.toHaveBeenCalled();
    });

    it('does not call the protected endpoint for candidates', async () => {
        mocks.cookie.mockReturnValue({ value: 'candidate-token' });
        mocks.decode.mockReturnValue({ role: 'candidate' });
        expect(await getViewerJobCategoriesAction()).toEqual([]);
        expect(mocks.get).not.toHaveBeenCalled();
    });

    it.each(['admin', 'recruiter', 'org_admin'])('reads staff categories for %s and surfaces API failures', async (role) => {
        mocks.cookie.mockReturnValue({ value: 'staff-token' });
        mocks.decode.mockReturnValue({ role });
        mocks.get.mockResolvedValueOnce({ data: [{ categoryId: 'one', name: 'Engineering' }] });
        expect(await getViewerJobCategoriesAction()).toEqual([{ categoryId: 'one', name: 'Engineering' }]);
        mocks.get.mockRejectedValueOnce(new Error('offline'));
        await expect(getViewerJobCategoriesAction()).rejects.toThrow('Không thể tải dữ liệu');
    });
});
