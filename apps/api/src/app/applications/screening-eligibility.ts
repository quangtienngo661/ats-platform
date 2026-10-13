import { ApplicationStatus, ScreeningStatus } from '@ats-platform/database';
import { ScreeningSkipReason } from '@ats-platform/types';

/**
 * How many times a recruiter may re-trigger a screening that keeps failing.
 * `CVScreening.retryCount` is incremented on every manual re-trigger; without a
 * cap a permanently-broken CV could be re-queued (and re-billed to Gemini) forever.
 */
export const MAX_SCREENING_RETRIES = 3;

export interface ScreeningSubject {
  status: ApplicationStatus;
  screening: { status: ScreeningStatus; retryCount?: number } | null;
}

export type EligibilityVerdict =
  | { eligible: true; needsMove: boolean }
  | {
      eligible: false;
      reason: ScreeningSkipReason;
      httpStatus: 400 | 409;
      message: string;
    };

export function checkScreeningEligibility(
  subject: ScreeningSubject,
  options: { allowApplied: boolean },
): EligibilityVerdict {
  if (subject.status === ApplicationStatus.applied && !options.allowApplied) {
    return {
      eligible: false,
      reason: ScreeningSkipReason.APPLIED_NOT_MOVED,
      httpStatus: 400,
      message:
        `Hãy chuyển đơn ứng tuyển sang trạng thái 'screening' trước khi chạy sàng lọc AI`,
    };
  }
  if (
    subject.status === ApplicationStatus.hired ||
    subject.status === ApplicationStatus.rejected ||
    subject.status === ApplicationStatus.cancelled
  ) {
    return {
      eligible: false,
      reason: ScreeningSkipReason.FINAL_STATUS,
      httpStatus: 400,
      message: `Không thể chạy sàng lọc AI khi đơn ứng tuyển đang ở trạng thái '${subject.status}'`,
    };
  }
  if (subject.screening?.status === ScreeningStatus.pending) {
    return {
      eligible: false,
      reason: ScreeningSkipReason.IN_QUEUE,
      httpStatus: 409,
      message: 'Sàng lọc AI đã được đưa vào hàng đợi',
    };
  }
  if (subject.screening?.status === ScreeningStatus.processing) {
    return {
      eligible: false,
      reason: ScreeningSkipReason.IN_QUEUE,
      httpStatus: 409,
      message: 'Sàng lọc AI đang được xử lý',
    };
  }
  if (subject.screening?.status === ScreeningStatus.completed) {
    return {
      eligible: false,
      reason: ScreeningSkipReason.ALREADY_SCREENED,
      httpStatus: 409,
      message:
        'Sàng lọc AI đã hoàn tất. Vui lòng xem kết quả trong chi tiết đơn ứng tuyển',
    };
  }
  if (
    subject.screening?.status === ScreeningStatus.failed &&
    (subject.screening.retryCount ?? 0) >= MAX_SCREENING_RETRIES
  ) {
    return {
      eligible: false,
      reason: ScreeningSkipReason.RETRY_LIMIT,
      httpStatus: 409,
      message: `Sàng lọc AI đã thất bại ${MAX_SCREENING_RETRIES} lần. Vui lòng kiểm tra lại CV hoặc liên hệ quản trị viên`,
    };
  }

  return {
    eligible: true,
    needsMove: subject.status === ApplicationStatus.applied,
  };
}
