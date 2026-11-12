import { costOf, summarizeCost, UsageGroupRow } from './ai-cost';

const price = (modelName: string, input: number, output: number) => ({
  modelName,
  inputUsdPerMillion: input,
  outputUsdPerMillion: output,
});
const row = (overrides: Partial<UsageGroupRow>): UsageGroupRow => ({
  month: '2026-11',
  actionType: 'cv_scoring',
  modelName: 'model-a',
  calls: 1,
  failedCalls: 0,
  promptTokens: 0,
  completionTokens: 0,
  ...overrides,
});

describe('costOf', () => {
  it('prices input and output tokens per million, to 6 decimal places', () => {
    // 1 234 × 2.5/1e6 + 567 × 10/1e6 = 0.003085 + 0.00567 = 0.008755
    expect(costOf(1_234, 567, price('m', 2.5, 10))).toBe(0.008755);
  });

  it('rounds the seventh decimal', () => {
    // 1 × 0.15 / 1e6 = 0.00000015 → 0
    expect(costOf(1, 0, price('m', 0.15, 0))).toBe(0);
    // 7 × 0.15 / 1e6 = 0.00000105 → 0.000001
    expect(costOf(7, 0, price('m', 0.15, 0))).toBe(0.000001);
  });

  it('is null without a price, never 0', () => {
    expect(costOf(1_000, 1_000, undefined)).toBeNull();
  });
});

describe('summarizeCost', () => {
  const prices = [price('model-a', 2, 8), price('embed-1', 0.02, 0)];

  it('folds models into month × action and keeps the totals exact', () => {
    const result = summarizeCost(
      [
        row({ modelName: 'model-a', calls: 3, promptTokens: 1_000_000, completionTokens: 250_000 }), // 2 + 2 = 4
        row({ modelName: 'model-a', calls: 1, failedCalls: 1 }),
        row({ actionType: 'embedding', modelName: 'embed-1', calls: 10, promptTokens: 500_000 }), // 0.01
        row({ month: '2026-10', modelName: 'model-a', calls: 2, promptTokens: 100_000, completionTokens: 10_000 }), // 0.2 + 0.08
      ],
      prices,
    );

    expect(result.items).toEqual([
      { month: '2026-11', actionType: 'cv_scoring', calls: 4, failedCalls: 1, promptTokens: 1_000_000, completionTokens: 250_000, estimatedCostUsd: 4 },
      { month: '2026-11', actionType: 'embedding', calls: 10, failedCalls: 0, promptTokens: 500_000, completionTokens: 0, estimatedCostUsd: 0.01 },
      { month: '2026-10', actionType: 'cv_scoring', calls: 2, failedCalls: 0, promptTokens: 100_000, completionTokens: 10_000, estimatedCostUsd: 0.28 },
    ]);
    expect(result.totals).toEqual({ calls: 16, promptTokens: 1_600_000, completionTokens: 260_000, estimatedCostUsd: 4.29 });
    expect(result.modelsWithoutPrice).toEqual([]);
  });

  it('a group with an unpriced model has no cost, and the total says so instead of under-counting', () => {
    const result = summarizeCost(
      [
        row({ modelName: 'model-a', promptTokens: 1_000_000 }),
        row({ modelName: 'mystery-model', promptTokens: 10 }),
      ],
      prices,
    );

    expect(result.items[0].estimatedCostUsd).toBeNull();
    expect(result.totals.estimatedCostUsd).toBeNull();
    expect(result.modelsWithoutPrice).toEqual(['mystery-model']);
  });

  it('a failed call of an unpriced model costs nothing and is not reported as missing a price', () => {
    const result = summarizeCost([row({ modelName: 'mystery-model', calls: 1, failedCalls: 1 })], prices);

    expect(result.items[0].estimatedCostUsd).toBe(0);
    expect(result.modelsWithoutPrice).toEqual([]);
  });

  it('no usage → no rows and a zero total', () => {
    expect(summarizeCost([], prices)).toEqual({
      items: [],
      totals: { calls: 0, promptTokens: 0, completionTokens: 0, estimatedCostUsd: 0 },
      modelsWithoutPrice: [],
    });
  });
});
