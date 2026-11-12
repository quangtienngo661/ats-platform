/**
 * The co-pilot's next-step rules (GĐ4 part 2, R9–R10). Pure: the caller loads the facts,
 * this decides. The first rule that matches wins. A suggestion never changes anything by
 * itself — a recruiter applies or dismisses it (ADR 0002), and a rejection always goes
 * through the existing reject flow with its reason, never through a co-pilot button.
 */

export type CopilotApplicationStatus =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'cancelled';

export type CopilotRuleId =
  | 'below_threshold'
  | 'move_to_screening'
  | 'screening_missing'
  | 'invite_interview'
  | 'schedule_needed'
  | 'scorecard_needed'
  | 'interview_concerns'
  | 'offer_ready'
  | 'offer_waiting';

export type CopilotAction =
  | { type: 'move_status'; to: 'screening' | 'interview' | 'offer' }
  | { type: 'run_screening' }
  | { type: 'schedule_interview' }
  | { type: 'open_profile' };

export interface CopilotFacts {
  status: CopilotApplicationStatus;
  /** When the application entered its current status. */
  currentStageSince: Date;
  screening: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    /** The effective overall score (the reviewer's when reviewed). */
    overall: number | null;
    isReviewed: boolean;
    /** minimumScoreThreshold of the config that scored it. */
    threshold: number | null;
  } | null;
  schedules: Array<{
    status: 'scheduled' | 'completed' | 'cancelled';
    startAt: Date;
    durationMinutes: number;
    scorecardRecommendation: 'strong_no' | 'no' | 'yes' | 'strong_yes' | null;
  }>;
}

export interface CopilotSuggestion {
  ruleId: CopilotRuleId;
  /** Changes whenever the status or the time it was entered changes (R10, R13). */
  key: string;
  title: string;
  reasons: string[];
  action: CopilotAction;
}

export const STALE_AFTER_DAYS = 14;
export const OFFER_FOLLOW_UP_DAYS = 7;
const DAY = 86_400_000;

const OPEN_STATUSES: ReadonlySet<CopilotApplicationStatus> = new Set([
  'applied',
  'screening',
  'interview',
  'offer',
]);

/** Whole days since `since`, never negative. */
export function daysSince(since: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - since.getTime()) / DAY));
}

function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function suggestNextStep(facts: CopilotFacts, now: Date): CopilotSuggestion | null {
  if (!OPEN_STATUSES.has(facts.status)) return null;

  const days = daysSince(facts.currentStageSince, now);
  const make = (
    ruleId: CopilotRuleId,
    title: string,
    reasons: string[],
    action: CopilotAction,
  ): CopilotSuggestion => ({
    ruleId,
    key: `${ruleId}:${facts.status}:${facts.currentStageSince.toISOString()}`,
    title,
    reasons:
      days >= STALE_AFTER_DAYS
        ? [...reasons, `Hồ sơ đứng yên ${days} ngày ở giai đoạn hiện tại.`]
        : reasons,
    action,
  });

  const screening = facts.screening;
  const scored =
    screening?.status === 'completed' &&
    screening.overall !== null &&
    screening.threshold !== null
      ? { overall: screening.overall, threshold: screening.threshold, isReviewed: screening.isReviewed }
      : null;
  const scoreReason = (s: NonNullable<typeof scored>) =>
    `Điểm sàng lọc ${formatScore(s.overall)}${s.isReviewed ? ' (đã duyệt)' : ' (AI)'}, ngưỡng ${formatScore(s.threshold)}.`;

  if (facts.status === 'applied' || facts.status === 'screening') {
    if (scored && scored.overall < scored.threshold) {
      return make(
        'below_threshold',
        'Xem lại hồ sơ: điểm dưới ngưỡng',
        [scoreReason(scored), 'Quyết định từ chối do người tuyển dụng đưa ra, kèm lý do.'],
        { type: 'open_profile' },
      );
    }
    if (facts.status === 'applied') {
      return make(
        'move_to_screening',
        'Chuyển sang vòng Sàng lọc',
        scored ? [scoreReason(scored)] : ['Đơn mới chưa được sàng lọc.'],
        { type: 'move_status', to: 'screening' },
      );
    }
    if (!screening || screening.status === 'failed') {
      return make(
        'screening_missing',
        'Chạy sàng lọc AI',
        [screening ? 'Lần sàng lọc trước bị lỗi.' : 'Hồ sơ chưa được AI sàng lọc.'],
        { type: 'run_screening' },
      );
    }
    if (scored) {
      return make('invite_interview', 'Mời phỏng vấn', [scoreReason(scored)], {
        type: 'move_status',
        to: 'interview',
      });
    }
    return null; // queued or running, or a score without a threshold (E5)
  }

  if (facts.status === 'interview') {
    const live = facts.schedules.filter((s) => s.status !== 'cancelled');
    if (live.length === 0) {
      return make('schedule_needed', 'Đặt lịch phỏng vấn', ['Chưa có lịch phỏng vấn nào.'], {
        type: 'schedule_interview',
      });
    }
    const ended = live.filter(
      (s) =>
        s.status === 'completed' ||
        s.startAt.getTime() + s.durationMinutes * 60_000 <= now.getTime(),
    );
    if (ended.some((s) => s.scorecardRecommendation === null)) {
      return make(
        'scorecard_needed',
        'Nhập đánh giá buổi phỏng vấn',
        ['Buổi phỏng vấn đã kết thúc nhưng chưa có đánh giá.'],
        { type: 'open_profile' },
      );
    }
    const verdicts = live
      .map((s) => s.scorecardRecommendation)
      .filter((r): r is NonNullable<typeof r> => r !== null);
    const negative = verdicts.filter((r) => r === 'no' || r === 'strong_no').length;
    if (negative > 0) {
      return make(
        'interview_concerns',
        'Xem lại: người phỏng vấn không đề xuất',
        [`${negative}/${verdicts.length} đánh giá không đề xuất tuyển.`],
        { type: 'open_profile' },
      );
    }
    if (verdicts.length > 0 && ended.length === live.length) {
      return make(
        'offer_ready',
        'Gửi đề nghị (Offer)',
        [`${verdicts.length}/${verdicts.length} đánh giá đề xuất tuyển.`],
        { type: 'move_status', to: 'offer' },
      );
    }
    return null; // an interview is still to come
  }

  // offer
  if (days >= OFFER_FOLLOW_UP_DAYS) {
    return make(
      'offer_waiting',
      `Theo dõi đề nghị đã chờ ${days} ngày`,
      ['Ứng viên chưa có phản hồi được ghi nhận.'],
      { type: 'open_profile' },
    );
  }
  return null;
}
