import { describe, expect, it } from 'vitest';
import { UI_VARIANT_COOKIE, resolveUiVariant } from './ui-variant';

describe('resolveUiVariant', () => {
  it('names the cookie talentai-ui', () => {
    expect(UI_VARIANT_COOKIE).toBe('talentai-ui');
  });

  it.each([
    ['legacy', undefined, 'legacy'],
    ['modern', 'legacy', 'modern'],
    [undefined, 'legacy', 'legacy'],
    ['LEGACY', undefined, 'modern'],
    ['x', 'y', 'modern'],
    [undefined, undefined, 'modern'],
    ['', 'legacy', 'legacy'],
  ] as const)('cookie %j with env %j gives %s', (cookie, env, expected) => {
    expect(resolveUiVariant(cookie, env)).toBe(expected);
  });
});
