import {
  ApplicationStatus,
  ScreeningSkipReason,
  ScreeningStatus,
} from '@ats-platform/types';
import {
  checkScreeningEligibility,
  MAX_SCREENING_RETRIES,
} from './screening-eligibility';
import type {
  EligibilityVerdict,
  ScreeningSubject,
} from './screening-eligibility';

describe('checkScreeningEligibility', () => {
  it('sets MAX_SCREENING_RETRIES to 3', () => {
    expect(MAX_SCREENING_RETRIES).toBe(3);
  });

  it.each<{
    name: string;
    subject: ScreeningSubject;
    allowApplied: boolean;
    expected: EligibilityVerdict;
  }>([
    {
      name: 'applied/null/allowApplied=false → APPLIED_NOT_MOVED',
      subject: { status: ApplicationStatus.applied, screening: null },
      allowApplied: false,
      expected: {
        eligible: false,
        reason: ScreeningSkipReason.APPLIED_NOT_MOVED,
        httpStatus: 400,
        message:
          "Hãy chuyển đơn ứng tuyển sang trạng thái 'screening' trước khi chạy sàng lọc AI",
      },
    },
    {
      name: 'applied/null/allowApplied=true → eligible with a move',
      subject: { status: ApplicationStatus.applied, screening: null },
      allowApplied: true,
      expected: { eligible: true, needsMove: true },
    },
    {
      name: 'applied/completed/allowApplied=true → ALREADY_SCREENED',
      subject: {
        status: ApplicationStatus.applied,
        screening: { status: ScreeningStatus.completed },
      },
      allowApplied: true,
      expected: {
        eligible: false,
        reason: ScreeningSkipReason.ALREADY_SCREENED,
        httpStatus: 409,
        message:
          'Sàng lọc AI đã hoàn tất. Vui lòng xem kết quả trong chi tiết đơn ứng tuyển',
      },
    },
    {
      name: 'hired/null → FINAL_STATUS',
      subject: { status: ApplicationStatus.hired, screening: null },
      allowApplied: false,
      expected: {
        eligible: false,
        reason: ScreeningSkipReason.FINAL_STATUS,
        httpStatus: 400,
        message:
          "Không thể chạy sàng lọc AI khi đơn ứng tuyển đang ở trạng thái 'hired'",
      },
    },
    {
      name: 'rejected/null → FINAL_STATUS',
      subject: { status: ApplicationStatus.rejected, screening: null },
      allowApplied: false,
      expected: {
        eligible: false,
        reason: ScreeningSkipReason.FINAL_STATUS,
        httpStatus: 400,
        message:
          "Không thể chạy sàng lọc AI khi đơn ứng tuyển đang ở trạng thái 'rejected'",
      },
    },
    {
      name: 'cancelled/null → FINAL_STATUS',
      subject: { status: ApplicationStatus.cancelled, screening: null },
      allowApplied: false,
      expected: {
        eligible: false,
        reason: ScreeningSkipReason.FINAL_STATUS,
        httpStatus: 400,
        message:
          "Không thể chạy sàng lọc AI khi đơn ứng tuyển đang ở trạng thái 'cancelled'",
      },
    },
    {
      name: 'screening/pending → IN_QUEUE',
      subject: {
        status: ApplicationStatus.screening,
        screening: { status: ScreeningStatus.pending },
      },
      allowApplied: false,
      expected: {
        eligible: false,
        reason: ScreeningSkipReason.IN_QUEUE,
        httpStatus: 409,
        message: 'Sàng lọc AI đã được đưa vào hàng đợi',
      },
    },
    {
      name: 'screening/processing → IN_QUEUE',
      subject: {
        status: ApplicationStatus.screening,
        screening: { status: ScreeningStatus.processing },
      },
      allowApplied: false,
      expected: {
        eligible: false,
        reason: ScreeningSkipReason.IN_QUEUE,
        httpStatus: 409,
        message: 'Sàng lọc AI đang được xử lý',
      },
    },
    {
      name: 'interview/completed → ALREADY_SCREENED',
      subject: {
        status: ApplicationStatus.interview,
        screening: { status: ScreeningStatus.completed },
      },
      allowApplied: false,
      expected: {
        eligible: false,
        reason: ScreeningSkipReason.ALREADY_SCREENED,
        httpStatus: 409,
        message:
          'Sàng lọc AI đã hoàn tất. Vui lòng xem kết quả trong chi tiết đơn ứng tuyển',
      },
    },
    {
      name: 'offer/failed/retryCount=3 → RETRY_LIMIT',
      subject: {
        status: ApplicationStatus.offer,
        screening: { status: ScreeningStatus.failed, retryCount: 3 },
      },
      allowApplied: false,
      expected: {
        eligible: false,
        reason: ScreeningSkipReason.RETRY_LIMIT,
        httpStatus: 409,
        message:
          'Sàng lọc AI đã thất bại 3 lần. Vui lòng kiểm tra lại CV hoặc liên hệ quản trị viên',
      },
    },
    {
      name: 'screening/failed/retryCount=2 → eligible without a move',
      subject: {
        status: ApplicationStatus.screening,
        screening: { status: ScreeningStatus.failed, retryCount: 2 },
      },
      allowApplied: false,
      expected: { eligible: true, needsMove: false },
    },
    {
      name: 'screening/null → eligible without a move',
      subject: { status: ApplicationStatus.screening, screening: null },
      allowApplied: false,
      expected: { eligible: true, needsMove: false },
    },
  ])('$name', ({ subject, allowApplied, expected }) => {
    expect(checkScreeningEligibility(subject, { allowApplied })).toEqual(
      expected,
    );
  });
});
