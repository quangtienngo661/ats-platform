import {
  averageDaysToHire,
  dailyTrend,
  funnel,
  MetricsApplication,
  outcomes,
  reachedStages,
  timeInStage,
} from './recruitment-metrics';

const T0 = new Date('2026-11-01T02:00:00.000Z');
const at = (days: number) => new Date(T0.getTime() + days * 86_400_000);

/** An application that walked through `path`, one status per `stepDays` days. */
const walked = (id: string, path: string[], stepDays = 1): MetricsApplication => ({
  applicationId: id,
  status: path[path.length - 1],
  appliedAt: T0,
  history: path.map((to, i) => ({ fromStatus: i === 0 ? null : path[i - 1], toStatus: to, changedAt: at(i * stepDays) })),
});

describe('funnel', () => {
  it('an empty period is all zeros with no conversion rate (E6)', () => {
    expect(funnel([])).toEqual([
      { stage: 'applied', reached: 0, conversion: null },
      { stage: 'screening', reached: 0, conversion: null },
      { stage: 'interview', reached: 0, conversion: null },
      { stage: 'offer', reached: 0, conversion: null },
      { stage: 'hired', reached: 0, conversion: null },
    ]);
  });

  it('counts every stage an application ever reached, with the rate against the stage before', () => {
    const apps = [
      walked('a', ['applied', 'screening', 'interview', 'offer', 'hired']),
      walked('b', ['applied', 'screening', 'interview', 'rejected']),
      walked('c', ['applied', 'screening']),
      walked('d', ['applied']),
    ];

    expect(funnel(apps)).toEqual([
      { stage: 'applied', reached: 4, conversion: null },
      { stage: 'screening', reached: 3, conversion: 0.75 },
      { stage: 'interview', reached: 2, conversion: 0.6667 },
      { stage: 'offer', reached: 1, conversion: 0.5 },
      { stage: 'hired', reached: 1, conversion: 1 },
    ]);
  });

  it('a reverted application still counts the stage it reached once', () => {
    const reverted = walked('r', ['applied', 'screening', 'interview', 'screening']);
    expect([...reachedStages(reverted)].sort()).toEqual(['applied', 'interview', 'screening']);
  });

  it('a jump that skips a stage counts only the stages it entered', () => {
    const jumped = walked('j', ['applied', 'interview']);
    const steps = funnel([jumped]);
    expect(steps.find((s) => s.stage === 'screening')?.reached).toBe(0);
    expect(steps.find((s) => s.stage === 'interview')?.reached).toBe(1);
    // 1 reached interview while 0 reached screening: no rate rather than a division by zero.
    expect(steps.find((s) => s.stage === 'interview')?.conversion).toBeNull();
  });

  it('the current status counts even without a history row (old data)', () => {
    const legacy: MetricsApplication = { applicationId: 'l', status: 'offer', appliedAt: T0, history: [] };
    expect([...reachedStages(legacy)].sort()).toEqual(['applied', 'offer']);
  });
});

describe('outcomes', () => {
  it('counts rejected and withdrawn applications apart', () => {
    expect(
      outcomes([
        walked('a', ['applied', 'rejected']),
        walked('b', ['applied', 'cancelled']),
        walked('c', ['applied', 'screening', 'rejected']),
      ]),
    ).toEqual({ rejected: 2, cancelled: 1 });
  });
});

describe('timeInStage', () => {
  it('averages the stays that ended and ignores the one still running', () => {
    const apps = [
      walked('a', ['applied', 'screening', 'interview'], 2), // applied 2d, screening 2d, interview still running
      walked('b', ['applied', 'screening'], 4), // applied 4d, screening still running
    ];

    expect(timeInStage(apps)).toEqual([
      { stage: 'applied', averageDays: 3, samples: 2 },
      { stage: 'screening', averageDays: 2, samples: 1 },
      { stage: 'interview', averageDays: null, samples: 0 },
      { stage: 'offer', averageDays: null, samples: 0 },
    ]);
  });

  it('a single application with one change has one sample', () => {
    expect(timeInStage([walked('a', ['applied', 'screening'], 1.5)])[0]).toEqual({
      stage: 'applied',
      averageDays: 1.5,
      samples: 1,
    });
  });
});

describe('averageDaysToHire', () => {
  it('is null without a hire, and the mean from applying to hired otherwise', () => {
    expect(averageDaysToHire([walked('a', ['applied', 'screening'])])).toBeNull();
    expect(
      averageDaysToHire([
        walked('a', ['applied', 'screening', 'interview', 'offer', 'hired'], 1), // 4 days
        walked('b', ['applied', 'screening', 'interview', 'offer', 'hired'], 2), // 8 days
      ]),
    ).toBe(6);
  });
});

describe('dailyTrend', () => {
  it('lists every day of the range in Vietnam time, zeros included', () => {
    const from = new Date('2026-11-01T00:00:00.000Z'); // 07:00 on 01/11 in Vietnam
    const to = new Date('2026-11-03T16:59:59.000Z'); // 23:59 on 03/11 in Vietnam
    const apps = [
      { appliedAt: new Date('2026-11-01T18:00:00.000Z') }, // 01:00 on 02/11 in Vietnam
      { appliedAt: new Date('2026-11-01T03:00:00.000Z') }, // 10:00 on 01/11
      { appliedAt: new Date('2026-11-01T04:00:00.000Z') },
    ];

    expect(dailyTrend(apps, from, to)).toEqual([
      { date: '2026-11-01', count: 2 },
      { date: '2026-11-02', count: 1 },
      { date: '2026-11-03', count: 0 },
    ]);
  });
});
