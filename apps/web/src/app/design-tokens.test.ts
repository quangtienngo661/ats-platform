import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/lib/contrast';

const css = readFileSync(resolve(__dirname, 'global.css'), 'utf8');

function rootBlock(source: string): string {
  const match = source.match(/(^|\n):root\s*\{([^}]*)\}/);
  if (!match) throw new Error('global.css has no :root block');
  return match[2];
}

const tokens = new Map<string, string>();
for (const m of rootBlock(css).matchAll(/--([a-z0-9-]+)\s*:\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)) {
  const hex = [m[2], m[3], m[4]]
    .map((n) => Number(n).toString(16).padStart(2, '0'))
    .join('');
  tokens.set(m[1], `#${hex}`);
}

function ratio(fg: string, bg: string): number {
  const f = tokens.get(fg);
  const b = tokens.get(bg);
  if (!f || !b) throw new Error(`missing token ${!f ? fg : bg}`);
  return contrastRatio(f, b);
}

const text: Array<[string, string]> = [];
for (const fg of ['ink', 'ink-2', 'ink-3']) {
  for (const bg of ['canvas', 'surface', 'surface-2']) text.push([fg, bg]);
}
for (const bg of ['canvas', 'surface', 'surface-2', 'accent-soft']) text.push(['accent-text', bg]);
for (const bg of ['accent', 'ink', 'danger-solid']) text.push(['surface', bg]);
for (const t of ['success', 'warning', 'danger']) {
  text.push([t, `${t}-soft`]);
}
for (const bg of ['night', 'night-2', 'night-3']) text.push(['night-ink', bg]);
text.push(['night-ink-2', 'night-2'], ['night-ink-3', 'night-3']);

describe('design tokens', () => {
  it('declares the expected number of channel tokens', () => {
    expect(tokens.size).toBe(26);
    expect(tokens.get('ink')).toBe('#171717');
  });

  it.each(text)('text %s on %s is at least 4.5:1', (fg, bg) => {
    expect(ratio(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['line-strong', 'surface'],
    ['accent', 'surface'],
    // Night controls (interview composer, night text buttons) draw their outline in night-ink-3.
    ['night-ink-3', 'night'],
    ['night-ink-3', 'night-2'],
  ])('component %s on %s is at least 3:1', (fg, bg) => {
    expect(ratio(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(3);
  });

  it('zeroes animation and transition under reduced motion for the modern ui', () => {
    const block = css.match(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*html\[data-ui="modern"\] \*[^{]*\{([^}]*)\}/,
    );
    expect(block, 'reduced-motion block for html[data-ui="modern"] *').not.toBeNull();
    const body = block?.[1] ?? '';
    expect(body).toMatch(/animation-duration:\s*0\.01ms/);
    expect(body).toMatch(/transition-duration:\s*0\.01ms/);
  });

  it('keeps spinners turning under reduced motion: a spinner shows progress, not decoration', () => {
    const block = css.match(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*(html\[data-ui="modern"\] \*[^{]*)\{([^}]*)\}/,
    );
    expect(block, 'reduced-motion block for html[data-ui="modern"] *').not.toBeNull();
    const selectors = (block?.[1] ?? '').split(',').map((s) => s.trim());
    expect(block?.[2]).toMatch(/animation-iteration-count:\s*1 !important/);
    expect(selectors).toContain('html[data-ui="modern"] *:not(.animate-spin)');
    expect(selectors).not.toContain('html[data-ui="modern"] *');
  });

  it('keeps the tailwind motion durations equal to the spec', () => {
    const config = require(resolve(__dirname, '../../tailwind.config.js'));
    expect(config.theme.extend.transitionDuration).toEqual({
      press: '120ms',
      hover: '200ms',
      base: '280ms',
      slow: '420ms',
    });
    expect(config.theme.extend.animation.rise).toContain('280ms');
  });
});

describe('modern text-wrap rules', () => {
  it('keep zero-class specificity so utilities such as truncate win', () => {
    const rules = [...css.matchAll(/([^{}]+)\{[^{}]*text-wrap[^{}]*\}/g)];
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      for (const selector of rule[1].split(',').map((s) => s.trim())) {
        expect(selector.startsWith(':where(html[data-ui="modern"])')).toBe(true);
      }
    }
    expect(css).not.toMatch(/(^|[\s,}])html\[data-ui="modern"\] p\b/);
  });
});
