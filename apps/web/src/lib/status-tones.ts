export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export type StatusKind =
    | 'application'
    | 'candidate-application'
    | 'job'
    | 'screening'
    | 'parsing'
    | 'schedule'
    | 'interview';

type Entry = readonly [label: string, tone: Tone];

const TABLE: Record<StatusKind, Record<string, Entry>> = {
    application: {
        applied: ['Mới', 'accent'],
        screening: ['Sàng lọc', 'warning'],
        interview: ['Phỏng vấn', 'accent'],
        offer: ['Offer', 'success'],
        hired: ['Đã tuyển', 'success'],
        rejected: ['Từ chối', 'danger'],
        cancelled: ['Đã hủy', 'neutral'],
    },
    'candidate-application': {
        applied: ['Đã nộp', 'accent'],
        screening: ['Sàng lọc AI', 'warning'],
        interview: ['Phỏng vấn', 'accent'],
        offer: ['Offer', 'success'],
        hired: ['Được tuyển', 'success'],
        rejected: ['Từ chối', 'danger'],
        cancelled: ['Đã rút', 'neutral'],
    },
    job: {
        draft: ['Bản nháp', 'neutral'],
        active: ['Đang tuyển', 'success'],
        closed: ['Đã đóng', 'warning'],
    },
    screening: {
        pending: ['Chờ sàng lọc', 'neutral'],
        processing: ['Đang sàng lọc', 'warning'],
        completed: ['Đã sàng lọc', 'success'],
        failed: ['Sàng lọc thất bại', 'danger'],
    },
    parsing: {
        pending: ['Chờ xử lý', 'neutral'],
        processing: ['Đang phân tích', 'warning'],
        completed: ['Đã phân tích', 'success'],
        failed: ['Lỗi phân tích', 'danger'],
    },
    schedule: {
        scheduled: ['Đã lên lịch', 'accent'],
        completed: ['Đã xong', 'success'],
        cancelled: ['Đã hủy', 'neutral'],
    },
    interview: {
        generating: ['Đang tạo câu hỏi', 'warning'],
        in_progress: ['Đang làm', 'accent'],
        pending_result: ['Đang chấm', 'warning'],
        completed: ['Hoàn thành', 'success'],
        abandon: ['Bỏ dở', 'neutral'],
    },
};

/** Label and tone for a status value. Unknown values fall back to neutral with the raw value. */
export function statusTone(kind: StatusKind, value: string): { tone: Tone; label: string } {
    const entry = Object.hasOwn(TABLE[kind], value) ? TABLE[kind][value] : undefined;
    return entry ? { tone: entry[1], label: entry[0] } : { tone: 'neutral', label: value };
}
