import { describe, expect, it } from 'vitest';
import { ScreeningSkipReason } from '@ats-platform/types';
import { SCREENING_SKIP_REASON_LABELS } from './screening-skip-reasons';

describe('screening skip reason labels', () => {
  it('every ScreeningSkipReason has a Vietnamese label', () => {
    const expectedLabels: Record<ScreeningSkipReason, string> = {
      NOT_IN_JOB: 'Không thuộc tin này',
      APPLIED_NOT_MOVED: "Đơn đang ở 'Mới', chưa đồng ý chuyển sang 'Sàng lọc'",
      FINAL_STATUS: 'Đơn đã kết thúc (đã tuyển, từ chối hoặc đã hủy)',
      IN_QUEUE: 'Đang chờ hoặc đang chấm',
      ALREADY_SCREENED: 'Đã có kết quả sàng lọc',
      RETRY_LIMIT: 'Đã thất bại 3 lần',
      STATUS_CHANGED: 'Trạng thái vừa bị người khác thay đổi',
      ENQUEUE_FAILED: 'Không đưa được vào hàng đợi',
    };

    expect(Object.values(ScreeningSkipReason)).toHaveLength(8);
    for (const reason of Object.values(ScreeningSkipReason)) {
      expect(SCREENING_SKIP_REASON_LABELS[reason]).toBeTypeOf('string');
      expect(SCREENING_SKIP_REASON_LABELS[reason].trim()).not.toBe('');
    }
    expect(SCREENING_SKIP_REASON_LABELS).toStrictEqual(expectedLabels);
  });
});
