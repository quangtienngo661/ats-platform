// Unit: the AI's action plan (a 3–5 sentence string) becomes ordered steps without losing or reordering text.
import { describe, expect, it } from 'vitest';
import { splitActionPlan } from './ActionPlanCard';

describe('splitActionPlan', () => {
    it('returns no steps for an empty or blank plan', () => {
        expect(splitActionPlan('')).toEqual([]);
        expect(splitActionPlan('   \n  ')).toEqual([]);
    });

    it('keeps a single sentence as one step', () => {
        expect(splitActionPlan('Ôn lại design patterns.')).toEqual(['Ôn lại design patterns.']);
    });

    it('splits sentences in their original order', () => {
        expect(splitActionPlan('Ôn lại Strategy pattern. Luyện SQL JOIN! Bạn đã thử Docker chưa? Đọc thêm về cache.')).toEqual([
            'Ôn lại Strategy pattern.',
            'Luyện SQL JOIN!',
            'Bạn đã thử Docker chưa?',
            'Đọc thêm về cache.',
        ]);
    });

    it('does not split inside names, versions or a sentence that continues in lower case', () => {
        expect(splitActionPlan('Học Node.js 20.5 và Next.js. Tìm hiểu thêm về index, v.v. cho truy vấn chậm.')).toEqual([
            'Học Node.js 20.5 và Next.js.',
            'Tìm hiểu thêm về index, v.v. cho truy vấn chậm.',
        ]);
    });

    it('uses existing lines and strips their list markers', () => {
        expect(splitActionPlan('1. Ôn lại hooks\n2) Luyện viết test\n- Đọc về RSC\n• Làm bài tập')).toEqual([
            'Ôn lại hooks',
            'Luyện viết test',
            'Đọc về RSC',
            'Làm bài tập',
        ]);
    });
});
