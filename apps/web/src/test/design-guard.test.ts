// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import allowList from './design-guard.allow.json';

const WEB_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SCAN_DIRS = ['src/components', 'src/app'];

/** Each rule is one regex run per line. `src/legacy` is outside SCAN_DIRS on purpose: it is frozen. */
const RULES: { name: string; pattern: RegExp }[] = [
  { name: 'raw hex colour class [#hex]; use a token', pattern: /\[#[0-9A-Fa-f]{3,8}\]/ },
  { name: 'inline fontFamily; use the font tokens', pattern: /fontFamily:/ },
  { name: 'arbitrary z-index z-[n]; use a z token', pattern: /z-\[\d+\]/ },
  { name: 'h-screen; use h-dvh or min-h-dvh', pattern: /\bh-screen\b/ },
  { name: 'import of @/types/fonts/fonts; use the font tokens', pattern: /@\/types\/fonts\/fonts/ },
];

function toPosix(path: string): string {
  return path.split(sep).join('/');
}

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx')) yield full;
  }
}

function findViolations(allowed: Set<string>): string[] {
  const found: string[] = [];
  for (const base of SCAN_DIRS) {
    for (const file of walk(join(WEB_ROOT, base))) {
      const rel = toPosix(relative(WEB_ROOT, file));
      if (allowed.has(rel)) continue;
      readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .forEach((line, i) => {
          for (const rule of RULES) {
            if (rule.pattern.test(line)) found.push(`${rel}:${i + 1}: ${rule.name}`);
          }
        });
    }
  }
  return found;
}

describe('design guard', () => {
  it('has no raw colours, font families, z-index numbers, h-screen or font imports outside the allow-list', () => {
    const violations = findViolations(new Set(Object.keys(allowList)));
    expect(violations, `\n${violations.join('\n')}\n`).toEqual([]);
  });

  it('allows only global-error.tsx, each entry with a reason', () => {
    expect(Object.keys(allowList)).toEqual(['src/app/global-error.tsx']);
    for (const reason of Object.values(allowList)) expect(reason.trim().length).toBeGreaterThan(20);
  });
});
