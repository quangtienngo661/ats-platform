import { describe, expect, it } from 'vitest';
import { avatarInitials, avatarTone } from './avatar-tone';

describe('avatarTone', () => {
    it('is stable for the same name', () => {
        expect(avatarTone('Trần Minh Khoa')).toEqual(avatarTone('Trần Minh Khoa'));
    });
    it('ignores case and surrounding spaces', () => {
        expect(avatarTone('trần minh khoa')).toEqual(avatarTone('Trần Minh Khoa'));
        expect(avatarTone('  Trần Minh Khoa ')).toEqual(avatarTone('Trần Minh Khoa'));
    });
    it('does not throw on an empty string', () => {
        expect(avatarTone('')).toEqual({ bg: expect.any(String), fg: expect.any(String) });
    });
    it('spreads 50 names over at least 4 colour pairs', () => {
        const pairs = new Set<string>();
        for (let i = 0; i < 50; i++) {
            const t = avatarTone(`Nguyễn Văn Ứng viên ${i}`);
            pairs.add(`${t.bg}|${t.fg}`);
        }
        expect(pairs.size).toBeGreaterThanOrEqual(4);
    });
});

describe('avatarInitials', () => {
    it.each([
        ['Lê Ngọc Hân', 'NH'],
        ['Trần Minh Khoa', 'MK'],
        ['An', 'A'],
        ['  nguyễn  văn  an ', 'VA'],
        ['', ''],
        // Job titles reach the avatar too (dashboard open jobs): punctuation is not an initial (Task 33 saw "E(").
        ['Senior Backend Engineer (NestJS)', 'EN'],
        ['Phân tích dữ liệu Đông Nam Á (', 'NÁ'],
        ['C++ / .NET', 'CN'],
        ['(…)', ''],
    ])('%j → %j', (name, initials) => {
        expect(avatarInitials(name)).toBe(initials);
    });
});
