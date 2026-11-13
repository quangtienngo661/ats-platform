// Unit: the AI's action plan becomes steps only where the text itself has lines or list markers; prose stays whole.
import { describe, expect, it } from 'vitest';
import { splitActionPlan } from './ActionPlanCard';

describe('splitActionPlan', () => {
    it('keeps prose with abbreviations as one step with the full text', () => {
        const plan = 'Học thêm về hệ thống phân tán. Chuyển tới TP. Hồ Chí Minh để thực tập.';
        expect(splitActionPlan(plan)).toEqual([plan]);
    });

    it('never splits on sentence punctuation, whatever follows it', () => {
        const plan = 'Ôn lại Strategy pattern. Luyện SQL JOIN! Đã thử Docker chưa? ThS. Nguyễn gợi ý e.g. React 19.';
        expect(splitActionPlan(plan)).toEqual([plan]);
    });

    it('returns no steps for an empty or blank plan', () => {
        expect(splitActionPlan('')).toEqual([]);
        expect(splitActionPlan('   \n \t\n  ')).toEqual([]);
    });

    it('splits numbered lines and drops the numbering', () => {
        expect(splitActionPlan('1. Ôn SQL\n2. Luyện system design')).toEqual(['Ôn SQL', 'Luyện system design']);
        expect(splitActionPlan('1) Ôn SQL\r\n2) Luyện system design')).toEqual(['Ôn SQL', 'Luyện system design']);
    });

    it('splits bulleted lines, skipping blank lines between them', () => {
        expect(splitActionPlan('- A\n- B\n\n- C')).toEqual(['A', 'B', 'C']);
        expect(splitActionPlan('• A\n* B')).toEqual(['A', 'B']);
    });

    it('keeps the order and the text of each line, punctuation included', () => {
        expect(splitActionPlan('Ôn lại hooks. Nhất là useEffect.\n  Đọc về RSC, e.g. Server Actions.  ')).toEqual([
            'Ôn lại hooks. Nhất là useEffect.',
            'Đọc về RSC, e.g. Server Actions.',
        ]);
    });

    it('strips a marker only at the start of a line', () => {
        expect(splitActionPlan('1. Ôn SQL, 2. Luyện system design')).toEqual(['Ôn SQL, 2. Luyện system design']);
    });
});
