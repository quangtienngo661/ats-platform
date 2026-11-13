import { describe, expect, it } from 'vitest';
import { hasModifier } from './keyboard';

const none = { altKey: false, ctrlKey: false, metaKey: false, shiftKey: false };

describe('hasModifier', () => {
    it.each([
        ['Alt', { ...none, altKey: true }],
        ['Ctrl', { ...none, ctrlKey: true }],
        ['Meta', { ...none, metaKey: true }],
        ['Ctrl+Alt', { ...none, ctrlKey: true, altKey: true }],
    ])('is true while %s is held, so the key belongs to a browser or OS shortcut', (_, e) => {
        expect(hasModifier(e)).toBe(true);
    });

    it('is false with no modifier and with Shift alone', () => {
        const shiftOnly = { ...none, shiftKey: true };
        expect(hasModifier(none)).toBe(false);
        expect(hasModifier(shiftOnly)).toBe(false);
    });
});
