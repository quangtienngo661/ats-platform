// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  getAiCostAction,
  getRecruitmentAnalyticsAction,
  setModelPriceAction,
} from './analytics.action';

const mocks = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: { get: mocks.get, put: mocks.put } }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('next/navigation', () => ({ unstable_rethrow: vi.fn() }));

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};
const initial = { success: false, message: '' };

describe('analytics actions', () => {
  it('asks for the recruitment analytics with only the filters that are set', async () => {
    mocks.get.mockResolvedValue({ data: { totals: {} } });

    await getRecruitmentAnalyticsAction({ from: '2026-11-01T00:00:00.000Z', to: '', jobId: undefined });

    expect(mocks.get).toHaveBeenCalledWith('/analytics/recruitment', { params: { from: '2026-11-01T00:00:00.000Z' } });
  });

  it('a failed read goes to the error page instead of becoming empty numbers', async () => {
    mocks.get.mockRejectedValue({ response: { status: 500 } });

    await expect(getAiCostAction({})).rejects.toThrow('Không tải được chi phí AI. Thử lại sau.');
  });

  it('saves a price as numbers and refreshes the pages that show it', async () => {
    mocks.put.mockResolvedValue({ data: {} });

    await expect(
      setModelPriceAction(initial, form({ modelName: 'gpt-6-luna', inputUsdPerMillion: '0,15', outputUsdPerMillion: '0.6' })),
    ).resolves.toEqual({ success: true, message: 'Đã lưu giá cho gpt-6-luna.' });
    expect(mocks.put).toHaveBeenCalledWith('/analytics/ai-model-prices/gpt-6-luna', {
      inputUsdPerMillion: 0.15,
      outputUsdPerMillion: 0.6,
    });
    expect(mocks.revalidate).toHaveBeenCalledWith('/ai-usage-logs');
    expect(mocks.revalidate).toHaveBeenCalledWith('/dashboard');
  });

  it.each([
    ['a negative price', '-1'],
    ['five decimals', '0.12345'],
    ['more than 100000', '100000.5'],
    ['text', 'abc'],
    ['nothing', ''],
  ])('refuses %s without calling the API', async (_label, value) => {
    await expect(
      setModelPriceAction(initial, form({ modelName: 'm', inputUsdPerMillion: value, outputUsdPerMillion: '1' })),
    ).resolves.toEqual({ success: false, message: 'Giá phải là số từ 0 đến 100000, tối đa 4 chữ số thập phân.' });
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it('accepts exactly 100000 and exactly 4 decimals', async () => {
    mocks.put.mockResolvedValue({ data: {} });

    await setModelPriceAction(initial, form({ modelName: 'm', inputUsdPerMillion: '100000', outputUsdPerMillion: '0.0001' }));

    expect(mocks.put).toHaveBeenCalledWith('/analytics/ai-model-prices/m', { inputUsdPerMillion: 100000, outputUsdPerMillion: 0.0001 });
  });
});
