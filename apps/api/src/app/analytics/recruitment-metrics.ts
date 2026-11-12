/**
 * Recruitment metrics (GĐ4 part 3, R18–R19). Pure: the service loads the rows of the
 * caller's scope, this counts. Kept free of Prisma so every edge is cheap to test.
 */

export const FUNNEL_STAGES = ['applied', 'screening', 'interview', 'offer', 'hired'] as const;
export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export interface MetricsApplication {
  applicationId: string;
  status: string;
  appliedAt: Date;
  /** Every status change, oldest first; the first is usually `null → applied`. */
  history: Array<{ fromStatus: string | null; toStatus: string; changedAt: Date }>;
}

export interface FunnelStep {
  stage: FunnelStage;
  reached: number;
  /** reached / reached of the previous stage, 0–1 rounded to 4 places; null for the first or after a 0. */
  conversion: number | null;
}

const DAY = 86_400_000;
const round = (value: number, places: number) => Math.round(value * 10 ** places) / 10 ** places;

/** R19: "reached S" = the history ever entered S, or S is the current status. */
export function reachedStages(app: MetricsApplication): Set<string> {
  const reached = new Set<string>(['applied']);
  for (const step of app.history) reached.add(step.toStatus);
  reached.add(app.status);
  return reached;
}

export function funnel(apps: MetricsApplication[]): FunnelStep[] {
  const reachedBy = apps.map(reachedStages);
  return FUNNEL_STAGES.map((stage, index) => {
    const reached = reachedBy.filter((set) => set.has(stage)).length;
    const previous = index === 0 ? null : reachedBy.filter((set) => set.has(FUNNEL_STAGES[index - 1])).length;
    return {
      stage,
      reached,
      conversion: previous === null || previous === 0 ? null : round(reached / previous, 4),
    };
  });
}

export function outcomes(apps: MetricsApplication[]) {
  return {
    rejected: apps.filter((a) => a.status === 'rejected').length,
    cancelled: apps.filter((a) => a.status === 'cancelled').length,
  };
}

export interface StageDuration {
  stage: FunnelStage;
  /** Mean days spent in the stage over the stays that have ended; null without any. */
  averageDays: number | null;
  samples: number;
}

/**
 * Time in each stage from consecutive history rows. A stay ends when the next change
 * happens; the stay the application is still in is not counted (spec C14).
 */
export function timeInStage(apps: MetricsApplication[]): StageDuration[] {
  const totals = new Map<string, { days: number; samples: number }>();
  for (const app of apps) {
    const steps = [...app.history].sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());
    for (let i = 0; i < steps.length - 1; i += 1) {
      const stage = steps[i].toStatus;
      const days = (steps[i + 1].changedAt.getTime() - steps[i].changedAt.getTime()) / DAY;
      const total = totals.get(stage) ?? { days: 0, samples: 0 };
      totals.set(stage, { days: total.days + days, samples: total.samples + 1 });
    }
  }
  return FUNNEL_STAGES.filter((stage) => stage !== 'hired').map((stage) => {
    const total = totals.get(stage);
    return {
      stage,
      averageDays: total ? round(total.days / total.samples, 1) : null,
      samples: total?.samples ?? 0,
    };
  });
}

/** Mean days from applying to the move into `hired`, over the hires in the set. */
export function averageDaysToHire(apps: MetricsApplication[]): number | null {
  const spans = apps
    .map((app) => {
      const hired = app.history.find((step) => step.toStatus === 'hired');
      return hired ? (hired.changedAt.getTime() - app.appliedAt.getTime()) / DAY : null;
    })
    .filter((span): span is number => span !== null);
  return spans.length === 0 ? null : round(spans.reduce((a, b) => a + b, 0) / spans.length, 1);
}

/** Applications per calendar day (Vietnam time), every day of the range present, zeros included. */
export function dailyTrend(apps: Pick<MetricsApplication, 'appliedAt'>[], from: Date, to: Date) {
  const key = (date: Date) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date);
  const counts = new Map<string, number>();
  for (let t = from.getTime(); t <= to.getTime(); t += DAY) counts.set(key(new Date(t)), 0);
  counts.set(key(to), counts.get(key(to)) ?? 0);
  for (const app of apps) {
    const day = key(app.appliedAt);
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return [...counts.entries()].map(([date, count]) => ({ date, count }));
}
