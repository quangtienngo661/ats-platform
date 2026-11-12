import {
  CopilotFacts,
  daysSince,
  suggestNextStep,
} from './copilot-rules';

const NOW = new Date('2026-11-20T03:00:00.000Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const SINCE = daysAgo(2);

const facts = (overrides: Partial<CopilotFacts> = {}): CopilotFacts => ({
  status: 'screening',
  currentStageSince: SINCE,
  screening: null,
  schedules: [],
  ...overrides,
});
const scored = (overall: number | null, threshold: number | null = 60, isReviewed = false) => ({
  status: 'completed' as const,
  overall,
  threshold,
  isReviewed,
});
const schedule = (
  overrides: Partial<CopilotFacts['schedules'][number]> = {},
): CopilotFacts['schedules'][number] => ({
  status: 'scheduled',
  startAt: daysAgo(1),
  durationMinutes: 60,
  scorecardRecommendation: null,
  ...overrides,
});

const suggest = (f: CopilotFacts) => suggestNextStep(f, NOW);

describe('suggestNextStep — screening stages', () => {
  it('a score exactly at the threshold passes: invite to interview', () => {
    const s = suggest(facts({ screening: scored(60, 60) }));

    expect(s).toEqual({
      ruleId: 'invite_interview',
      key: `invite_interview:screening:${SINCE.toISOString()}`,
      title: 'Mời phỏng vấn',
      reasons: ['Điểm sàng lọc 60 (AI), ngưỡng 60.'],
      action: { type: 'move_status', to: 'interview' },
    });
  });

  it('a score just under the threshold asks for a human look, never a one-click rejection', () => {
    const s = suggest(facts({ screening: scored(59.9, 60) }));

    expect(s?.ruleId).toBe('below_threshold');
    expect(s?.action).toEqual({ type: 'open_profile' });
    expect(s?.reasons).toEqual([
      'Điểm sàng lọc 59.9 (AI), ngưỡng 60.',
      'Quyết định từ chối do người tuyển dụng đưa ra, kèm lý do.',
    ]);
  });

  it('uses the reviewed score and says so', () => {
    expect(suggest(facts({ screening: scored(72.5, 60, true) }))?.reasons).toEqual([
      'Điểm sàng lọc 72.5 (đã duyệt), ngưỡng 60.',
    ]);
  });

  it.each([
    ['no screening yet', null, 'Hồ sơ chưa được AI sàng lọc.'],
    ['a failed screening', { status: 'failed' as const, overall: null, threshold: 60, isReviewed: false }, 'Lần sàng lọc trước bị lỗi.'],
  ])('at screening with %s: run the AI screening', (_label, screening, reason) => {
    const s = suggest(facts({ screening }));

    expect(s?.ruleId).toBe('screening_missing');
    expect(s?.reasons).toEqual([reason]);
    expect(s?.action).toEqual({ type: 'run_screening' });
  });

  it.each(['pending', 'processing'] as const)('a %s screening suggests nothing yet', (status) => {
    expect(suggest(facts({ screening: { status, overall: null, threshold: 60, isReviewed: false } }))).toBeNull();
  });

  it.each([
    ['score', scored(null, 60)],
    ['threshold', scored(80, null)],
  ])('a completed screening without a %s suggests nothing (E5)', (_label, screening) => {
    expect(suggest(facts({ screening }))).toBeNull();
  });

  it('a new application moves to screening, which is where the AI screening may run', () => {
    const s = suggest(facts({ status: 'applied' }));

    expect(s?.ruleId).toBe('move_to_screening');
    expect(s?.reasons).toEqual(['Đơn mới chưa được sàng lọc.']);
    expect(s?.action).toEqual({ type: 'move_status', to: 'screening' });
  });

  it('an applied application already scored under the threshold asks for a human look first', () => {
    expect(suggest(facts({ status: 'applied', screening: scored(40, 60) }))?.ruleId).toBe('below_threshold');
  });
});

describe('suggestNextStep — interview stage', () => {
  it('no schedule: book one', () => {
    expect(suggest(facts({ status: 'interview' }))?.action).toEqual({ type: 'schedule_interview' });
  });

  it('only a cancelled schedule still counts as none', () => {
    expect(suggest(facts({ status: 'interview', schedules: [schedule({ status: 'cancelled' })] }))?.ruleId).toBe(
      'schedule_needed',
    );
  });

  it('an interview still to come suggests nothing', () => {
    const upcoming = schedule({ startAt: new Date(NOW.getTime() + 3_600_000) });
    expect(suggest(facts({ status: 'interview', schedules: [upcoming] }))).toBeNull();
  });

  it.each([
    ['marked completed', schedule({ status: 'completed' })],
    // Ended exactly now: 02:00 + 60 minutes = 03:00.
    ['scheduled but its end has passed', schedule({ startAt: new Date('2026-11-20T02:00:00.000Z') })],
  ])('an interview %s without a scorecard asks for one', (_label, s) => {
    expect(suggest(facts({ status: 'interview', schedules: [s] }))?.ruleId).toBe('scorecard_needed');
  });

  it('one minute before its end, it is not over yet', () => {
    const s = schedule({ startAt: new Date('2026-11-20T02:01:00.000Z') });
    expect(suggest(facts({ status: 'interview', schedules: [s] }))).toBeNull();
  });

  it('every scorecard in favour: send the offer', () => {
    const s = suggest(
      facts({
        status: 'interview',
        schedules: [
          schedule({ status: 'completed', scorecardRecommendation: 'yes' }),
          schedule({ status: 'completed', scorecardRecommendation: 'strong_yes' }),
        ],
      }),
    );

    expect(s?.ruleId).toBe('offer_ready');
    expect(s?.reasons).toEqual(['2/2 đánh giá đề xuất tuyển.']);
    expect(s?.action).toEqual({ type: 'move_status', to: 'offer' });
  });

  it('one scorecard against: a human looks, no offer button', () => {
    const s = suggest(
      facts({
        status: 'interview',
        schedules: [
          schedule({ status: 'completed', scorecardRecommendation: 'strong_yes' }),
          schedule({ status: 'completed', scorecardRecommendation: 'no' }),
        ],
      }),
    );

    expect(s?.ruleId).toBe('interview_concerns');
    expect(s?.reasons).toEqual(['1/2 đánh giá không đề xuất tuyển.']);
    expect(s?.action).toEqual({ type: 'open_profile' });
  });

  it('a positive scorecard with another round still to come is not an offer yet', () => {
    const s = suggest(
      facts({
        status: 'interview',
        schedules: [
          schedule({ status: 'completed', scorecardRecommendation: 'yes' }),
          schedule({ startAt: new Date(NOW.getTime() + 86_400_000) }),
        ],
      }),
    );
    expect(s).toBeNull();
  });
});

describe('suggestNextStep — offer and closed stages', () => {
  it.each([
    [6, null],
    [7, 'Theo dõi đề nghị đã chờ 7 ngày'],
  ])('an offer waiting %i days → %p', (days, title) => {
    const s = suggest(facts({ status: 'offer', currentStageSince: daysAgo(days) }));
    expect(s?.title ?? null).toBe(title);
  });

  it.each(['hired', 'rejected', 'cancelled'] as const)('a %s application gets no suggestion', (status) => {
    expect(suggest(facts({ status, screening: scored(90) }))).toBeNull();
  });
});

describe('stale applications', () => {
  it.each([
    [13, false],
    [14, true],
  ])('%i days in the stage adds the stale reason: %s', (days, stale) => {
    const s = suggest(facts({ currentStageSince: daysAgo(days), screening: scored(80) }));
    expect(s?.reasons.includes(`Hồ sơ đứng yên ${days} ngày ở giai đoạn hiện tại.`)).toBe(stale);
  });

  it('the key changes when the application re-enters the stage', () => {
    const before = suggest(facts({ screening: scored(80) }));
    const after = suggest(facts({ screening: scored(80), currentStageSince: daysAgo(1) }));
    expect(before?.key).not.toBe(after?.key);
  });
});

describe('daysSince', () => {
  it('counts whole days and never goes negative', () => {
    expect(daysSince(daysAgo(1.99), NOW)).toBe(1);
    expect(daysSince(new Date(NOW.getTime() + 60_000), NOW)).toBe(0);
  });
});
