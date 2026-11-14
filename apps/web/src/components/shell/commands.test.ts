import { describe, expect, it } from 'vitest';
import { buildCommands, filterCommands, normalizeVi } from './commands';

const labels = (role?: string) => buildCommands(role).map((c) => c.label);

describe('normalizeVi', () => {
    it('strips marks, maps đ, lowercases and collapses spaces', () => {
        expect(normalizeVi('Đơn ỨNG tuyển')).toBe('don ung tuyen');
        expect(normalizeVi('  Lịch   phỏng vấn ')).toBe('lich phong van');
    });
});

describe('buildCommands', () => {
    it('hides admin pages from a recruiter and shows them to an admin', () => {
        expect(labels('recruiter')).not.toContain('Quản lý người dùng');
        expect(labels('admin')).toContain('Quản lý người dùng');
    });

    it('always offers the profile and the legacy UI, with no href on the switch', () => {
        for (const role of ['recruiter', 'admin']) {
            const list = buildCommands(role);
            expect(list.find((c) => c.label === 'Hồ sơ của tôi')).toMatchObject({ group: 'Đi tới', href: '/my-profile' });
            expect(list.find((c) => c.label === 'Dùng giao diện cũ')).toMatchObject({
                id: 'ui-legacy',
                group: 'Giao diện',
            });
            expect(list.find((c) => c.id === 'ui-legacy')?.href).toBeUndefined();
        }
    });

    it('gives every command a unique id', () => {
        const ids = buildCommands('admin').map((c) => c.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});

describe('filterCommands', () => {
    const all = buildCommands('admin');
    const names = (q: string) => filterCommands(q, all).map((c) => c.label);

    it('returns everything, in order, for an empty query', () => {
        expect(filterCommands('  ', all)).toEqual(all);
    });

    it('matches word prefixes without diacritics', () => {
        expect(names('tin tuyen')).toEqual(['Tin tuyển dụng']);
        expect(names('lich')).toEqual(['Lịch phỏng vấn']);
        expect(names('phong ban')).toContain('Phòng ban');
    });

    it('matches keywords such as ứng viên', () => {
        expect(names('ung vien')).toContain('Tin tuyển dụng');
    });

    it('requires every query word to match', () => {
        expect(names('lich xyz')).toEqual([]);
        expect(names('xyz')).toEqual([]);
    });

    it('does not match mid-word', () => {
        expect(names('uyen')).toEqual([]);
    });
});
