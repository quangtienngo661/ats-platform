import { expect, it } from 'vitest';
import { positivePage } from './pagination';

it.each([undefined, '', '-1', '0', '2.5', 'Infinity', '1e2', '9007199254740992', ['1', '2']])('normalizes malformed page %j before an API request', (value) => {
    expect(positivePage(value)).toBe(1);
});
it('keeps a valid positive page', () => { expect(positivePage('12')).toBe(12); });
