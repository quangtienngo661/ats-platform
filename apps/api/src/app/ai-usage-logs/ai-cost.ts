/**
 * AI cost estimation (GĐ4 R21–R22). Prices are what an admin entered, in USD per one
 * million tokens; nothing is built in. A model without a price has a null cost and is
 * listed, so a total never silently leaves it out.
 */

export interface ModelPrice {
  modelName: string;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
}

export interface UsageGroupRow {
  month: string; // YYYY-MM
  actionType: string;
  modelName: string;
  calls: number;
  failedCalls: number;
  promptTokens: number;
  completionTokens: number;
}

export interface CostRow {
  month: string;
  actionType: string;
  calls: number;
  failedCalls: number;
  promptTokens: number;
  completionTokens: number;
  /** USD, 6 decimal places; null when any model in the group has no price. */
  estimatedCostUsd: number | null;
}

const round6 = (value: number) => Math.round(value * 1e6) / 1e6;

export function costOf(
  promptTokens: number,
  completionTokens: number,
  price: ModelPrice | undefined,
): number | null {
  if (!price) return null;
  return round6(
    (promptTokens * price.inputUsdPerMillion + completionTokens * price.outputUsdPerMillion) / 1_000_000,
  );
}

/** Rows grouped by month × action (models folded in), plus the models that lack a price. */
export function summarizeCost(rows: UsageGroupRow[], prices: ModelPrice[]) {
  const priceOf = new Map(prices.map((p) => [p.modelName, p]));
  const groups = new Map<string, CostRow>();
  const missing = new Set<string>();

  for (const row of rows) {
    const key = `${row.month}|${row.actionType}`;
    const group = groups.get(key) ?? {
      month: row.month,
      actionType: row.actionType,
      calls: 0,
      failedCalls: 0,
      promptTokens: 0,
      completionTokens: 0,
      estimatedCostUsd: 0,
    };
    const cost = costOf(row.promptTokens, row.completionTokens, priceOf.get(row.modelName));
    if (cost === null && row.promptTokens + row.completionTokens > 0) missing.add(row.modelName);

    group.calls += row.calls;
    group.failedCalls += row.failedCalls;
    group.promptTokens += row.promptTokens;
    group.completionTokens += row.completionTokens;
    // A failed call logs 0 tokens: it costs nothing whether or not its model is priced.
    group.estimatedCostUsd =
      group.estimatedCostUsd === null || (cost === null && row.promptTokens + row.completionTokens > 0)
        ? null
        : round6(group.estimatedCostUsd + (cost ?? 0));
    groups.set(key, group);
  }

  const items = [...groups.values()].sort((a, b) =>
    a.month === b.month ? a.actionType.localeCompare(b.actionType) : b.month.localeCompare(a.month),
  );
  const totalCost = items.some((i) => i.estimatedCostUsd === null)
    ? null
    : round6(items.reduce((sum, i) => sum + (i.estimatedCostUsd ?? 0), 0));
  return {
    items,
    totals: {
      calls: items.reduce((s, i) => s + i.calls, 0),
      promptTokens: items.reduce((s, i) => s + i.promptTokens, 0),
      completionTokens: items.reduce((s, i) => s + i.completionTokens, 0),
      estimatedCostUsd: totalCost,
    },
    modelsWithoutPrice: [...missing].sort(),
  };
}
