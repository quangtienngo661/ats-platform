// Run with:  node --test stats.test.mjs run-consistency.test.mjs   (from this folder; no services needed)
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPlan, parseArgs } from './run-consistency.mjs';

const pairs = (n) =>
  Array.from({ length: n }, (_, i) => ({
    pairId: `p${i + 1}`,
    applicationId: `app-${i + 1}`,
    cvId: `cv-${i + 1}`,
    configId: 'cfg',
    screeningId: `scr-${i + 1}`,
  }));

describe('buildPlan', () => {
  it('10 pairs × 3 modes × 5 runs = 150 jobs', () => {
    assert.equal(buildPlan(pairs(10), ['none', 'skills', 'skills_anchors'], 5).length, 150);
  });

  it('every pair × mode × run appears exactly once', () => {
    const plan = buildPlan(pairs(2), ['none', 'skills'], 3);
    const keys = plan.map((j) => `${j.pairId}/${j.mode}/${j.run}`);

    assert.equal(new Set(keys).size, 12);
    assert.ok(keys.includes('p2/skills/3'));
  });

  it('interleaves the modes: run 1 of everything finishes before run 2 starts (time drift hits every mode alike)', () => {
    const plan = buildPlan(pairs(2), ['none', 'skills'], 2);

    assert.deepEqual(
      plan.map((j) => j.run),
      [1, 1, 1, 1, 2, 2, 2, 2],
    );
    assert.deepEqual(
      plan.slice(0, 4).map((j) => `${j.pairId}/${j.mode}`),
      ['p1/none', 'p1/skills', 'p2/none', 'p2/skills'],
    );
  });

  it('a job carries the forced mode and never notifies the recruiter', () => {
    const [job] = buildPlan(pairs(1), ['skills_anchors'], 1);

    assert.deepEqual(job.data, {
      screeningId: 'scr-1',
      cvId: 'cv-1',
      applicationId: 'app-1',
      configId: 'cfg',
      notify: false,
      ragMode: 'skills_anchors',
    });
  });

  it('refuses a mode that the processor does not know', () => {
    assert.throws(() => buildPlan(pairs(1), ['magic'], 1), /mode/);
  });

  it('refuses zero runs or an empty dataset instead of producing an empty "successful" plan', () => {
    assert.throws(() => buildPlan(pairs(1), ['none'], 0), /runs/);
    assert.throws(() => buildPlan([], ['none'], 1), /pairs/);
  });

  it('refuses a pair that is missing an id the job needs', () => {
    const broken = [{ pairId: 'p1', applicationId: 'a', cvId: 'c', configId: 'x' }];

    assert.throws(() => buildPlan(broken, ['none'], 1), /screeningId/);
  });
});

describe('parseArgs', () => {
  it('defaults: all three modes, 5 runs, no dry run', () => {
    const args = parseArgs([]);

    assert.deepEqual(args.modes, ['none', 'skills', 'skills_anchors']);
    assert.equal(args.runs, 5);
    assert.equal(args.dryRun, false);
  });

  it('reads --dry-run, --runs and --modes', () => {
    const args = parseArgs(['--dry-run', '--runs', '2', '--modes', 'none,skills']);

    assert.equal(args.dryRun, true);
    assert.equal(args.runs, 2);
    assert.deepEqual(args.modes, ['none', 'skills']);
  });

  it('refuses a runs value that is not a positive integer, and unknown flags', () => {
    assert.throws(() => parseArgs(['--runs', 'x']), /runs/);
    assert.throws(() => parseArgs(['--runs', '0']), /runs/);
    assert.throws(() => parseArgs(['--wat']), /--wat/);
  });
});
