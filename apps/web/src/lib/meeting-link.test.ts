// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { isHttpUrl } from './meeting-link';

describe('isHttpUrl — which meeting links may become a link (E10)', () => {
  it.each(['https://meet.example.com/abc', 'http://zoom.example.com/j/123'])('accepts %s', (link) => {
    expect(isHttpUrl(link)).toBe(true);
  });

  it.each([
    ['a javascript: URL', 'javascript:alert(1)'],
    ['a link without a scheme', 'meet.example.com'],
    ['a missing link', null],
  ])('refuses %s', (_case, link) => {
    expect(isHttpUrl(link)).toBe(false);
  });
});
