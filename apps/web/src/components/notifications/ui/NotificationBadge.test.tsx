import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NotificationBadge } from './NotificationBadge';

const badge = (count: number) => render(<NotificationBadge count={count} />).container.firstElementChild;

describe('NotificationBadge', () => {
    it('shows nothing without unread notifications', () => {
        for (const count of [0, -1]) expect(badge(count)).toBeNull();
    });

    it('shows the count up to 99, then caps it at "99+"', () => {
        const shown = [1, 9, 10, 99, 100, 101, 250].map((count) => badge(count)?.textContent);
        expect(shown).toEqual(['1', '9', '10', '99', '99+', '99+', '99+']);
    });

    // jsdom computes no layout, so the fit of "99+" is pinned by the classes that give it room.
    it('token contract: a 16 px pill that widens for "99+", with the white edge drawn outside it', () => {
        const classes = (badge(250)?.className ?? '').split(' ');

        expect(classes).toEqual(expect.arrayContaining(['h-4', 'min-w-4', 'px-1', 'rounded-full', 'justify-center', 'tabular-nums']));
        // A 2 px border inside a 16 px box leaves 12 px for 11 px digits; a ring sits outside the box instead.
        expect(classes).toEqual(expect.arrayContaining(['ring-2', 'ring-surface']));
        expect(classes.filter((name) => /^border(-|$)/.test(name))).toEqual([]);
        expect(classes.some((name) => /^w-/.test(name))).toBe(false);
    });
});
