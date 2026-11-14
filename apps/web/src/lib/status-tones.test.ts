import {
    ApplicationStatus,
    InterviewStatus,
    JobStatus,
    ParsingStatus,
    ScheduleStatus,
    ScreeningStatus,
} from '@ats-platform/types';
import { describe, expect, it } from 'vitest';
import { statusTone, type StatusKind, type Tone } from './status-tones';

const table: Array<[StatusKind, string, string, Tone]> = [
    ['application', 'applied', 'Mới', 'accent'],
    ['application', 'screening', 'Sàng lọc', 'warning'],
    ['application', 'interview', 'Phỏng vấn', 'accent'],
    ['application', 'offer', 'Offer', 'success'],
    ['application', 'hired', 'Đã tuyển', 'success'],
    ['application', 'rejected', 'Từ chối', 'danger'],
    ['application', 'cancelled', 'Đã hủy', 'neutral'],
    ['candidate-application', 'applied', 'Đã nộp', 'accent'],
    ['candidate-application', 'screening', 'Sàng lọc AI', 'warning'],
    ['candidate-application', 'interview', 'Phỏng vấn', 'accent'],
    ['candidate-application', 'offer', 'Offer', 'success'],
    ['candidate-application', 'hired', 'Được tuyển', 'success'],
    ['candidate-application', 'rejected', 'Từ chối', 'danger'],
    ['candidate-application', 'cancelled', 'Đã rút', 'neutral'],
    ['job', 'draft', 'Bản nháp', 'neutral'],
    ['job', 'active', 'Đang tuyển', 'success'],
    ['job', 'closed', 'Đã đóng', 'warning'],
    ['screening', 'pending', 'Chờ sàng lọc', 'neutral'],
    ['screening', 'processing', 'Đang sàng lọc', 'warning'],
    ['screening', 'completed', 'Đã sàng lọc', 'success'],
    ['screening', 'failed', 'Sàng lọc thất bại', 'danger'],
    ['parsing', 'pending', 'Chờ xử lý', 'neutral'],
    ['parsing', 'processing', 'Đang phân tích', 'warning'],
    ['parsing', 'completed', 'Đã phân tích', 'success'],
    ['parsing', 'failed', 'Lỗi phân tích', 'danger'],
    ['schedule', 'scheduled', 'Đã lên lịch', 'accent'],
    ['schedule', 'completed', 'Đã xong', 'success'],
    ['schedule', 'cancelled', 'Đã hủy', 'neutral'],
    ['interview', 'generating', 'Đang tạo câu hỏi', 'warning'],
    ['interview', 'in_progress', 'Đang làm', 'accent'],
    ['interview', 'pending_result', 'Đang chấm', 'warning'],
    ['interview', 'completed', 'Hoàn thành', 'success'],
    ['interview', 'abandon', 'Bỏ dở', 'neutral'],
];

describe('statusTone', () => {
    it.each(table)('%s/%s → %s (%s)', (kind, value, label, tone) => {
        expect(statusTone(kind, value)).toEqual({ tone, label });
    });

    const enums: Array<[StatusKind, Record<string, string>]> = [
        ['application', ApplicationStatus],
        ['candidate-application', ApplicationStatus],
        ['job', JobStatus],
        ['screening', ScreeningStatus],
        ['parsing', ParsingStatus],
        ['schedule', ScheduleStatus],
        ['interview', InterviewStatus],
    ];
    it.each(enums)('every %s enum value has a label different from the raw value', (kind, values) => {
        for (const value of Object.values(values)) {
            expect(statusTone(kind, value).label).not.toBe(value);
        }
    });

    it('falls back to neutral with the raw value for unknown input', () => {
        expect(statusTone('job', 'weird')).toEqual({ tone: 'neutral', label: 'weird' });
    });
});
