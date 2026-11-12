// Run with:  node --test docs/tasks/gd3-rag/results/consistency/stats.test.mjs
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderSummary, summarize } from './stats.mjs';

const run = (pairId, mode, overall, others = {}) => ({
  pairId,
  mode,
  skills: overall,
  experience: overall,
  education: overall,
  overall,
  ...others,
});
const row = (rows, mode, field) => rows.find((r) => r.mode === mode && r.field === field);

describe('summarize', () => {
  it('population standard deviation per pair, then the mean and the largest over the pairs', () => {
    const rows = summarize([
      ...[70, 70, 70].map((v) => run('p1', 'none', v)),
      ...[60, 70, 80].map((v) => run('p2', 'none', v)),
    ]);

    const overall = row(rows, 'none', 'overall');
    // p1: 0. p2: sqrt(((-10)² + 0² + 10²) / 3) = sqrt(200 / 3) = 8.165.
    assert.ok(Math.abs(overall.maxStdev - 8.165) < 0.001, `maxStdev ${overall.maxStdev}`);
    assert.ok(Math.abs(overall.meanStdev - 4.082) < 0.001, `meanStdev ${overall.meanStdev}`);
  });

  it('a pair with one run has standard deviation 0', () => {
    const rows = summarize([run('p1', 'skills', 55)]);

    assert.equal(row(rows, 'skills', 'overall').meanStdev, 0);
    assert.equal(row(rows, 'skills', 'overall').maxStdev, 0);
  });

  it('identical scores give exactly 0, not a rounding crumb', () => {
    const rows = summarize([0.1, 0.1, 0.1, 0.1].map((v) => run('p1', 'none', v)));

    assert.equal(row(rows, 'none', 'overall').maxStdev, 0);
  });

  it('keeps the modes apart, and the four fields apart', () => {
    const rows = summarize([
      ...[70, 70].map((v) => run('p1', 'none', v)),
      ...[60, 80].map((v) => run('p1', 'skills', v, { experience: 50 })),
    ]);

    assert.equal(row(rows, 'none', 'overall').maxStdev, 0);
    assert.equal(row(rows, 'skills', 'overall').maxStdev, 10);
    assert.equal(row(rows, 'skills', 'experience').maxStdev, 0);
    assert.equal(row(rows, 'skills', 'skills').maxStdev, 10);
  });

  it('lists every mode × field once, modes in the order none, skills, skills_anchors', () => {
    const rows = summarize([
      run('p1', 'skills_anchors', 1),
      run('p1', 'none', 1),
      run('p1', 'skills', 1),
    ]);

    assert.deepEqual(
      rows.map((r) => `${r.mode}/${r.field}`),
      [
        'none/skills', 'none/experience', 'none/education', 'none/overall',
        'skills/skills', 'skills/experience', 'skills/education', 'skills/overall',
        'skills_anchors/skills', 'skills_anchors/experience', 'skills_anchors/education', 'skills_anchors/overall',
      ],
    );
  });

  it('only reports the modes that were run', () => {
    const rows = summarize([run('p1', 'none', 1), run('p1', 'none', 2)]);

    assert.deepEqual([...new Set(rows.map((r) => r.mode))], ['none']);
  });

  it('refuses a score that is not a finite number instead of averaging it in', () => {
    assert.throws(() => summarize([run('p1', 'none', Number.NaN)]), /overall/);
    assert.throws(() => summarize([run('p1', 'none', 70, { skills: null })]), /skills/);
  });

  it('refuses an unknown mode', () => {
    assert.throws(() => summarize([run('p1', 'magic', 1)]), /mode/);
  });

  it('no runs → no rows', () => {
    assert.deepEqual(summarize([]), []);
  });
});

describe('renderSummary', () => {
  const rows = summarize([
    ...[70, 74].map((v) => run('p1', 'none', v)),
    ...[71, 72].map((v) => run('p1', 'skills', v)),
  ]);

  it('is a markdown table with the settings that produced it', () => {
    const text = renderSummary(rows, {
      date: '2026-11-20',
      threshold: 0.8,
      anchorCount: 3,
      model: 'gpt-6.1-sol',
      runsPerCell: 2,
      pairs: 1,
    });

    assert.match(text, /\| Chế độ \| Trường \| Độ lệch chuẩn TB \| Độ lệch chuẩn lớn nhất \|/);
    assert.match(text, /\| none \| overall \| 2\.00 \| 2\.00 \|/);
    assert.match(text, /\| skills \| overall \| 0\.50 \| 0\.50 \|/);
    assert.match(text, /τ \(SKILL_MATCH_THRESHOLD\): 0\.8/);
    assert.match(text, /k \(ANCHOR_COUNT\): 3/);
    assert.match(text, /gpt-6\.1-sol/);
    assert.match(text, /2026-11-20/);
  });

  it('says so when skills_anchors did not lower the spread compared with skills (the numbers are never adjusted)', () => {
    const worse = summarize([
      ...[70, 71].map((v) => run('p1', 'skills', v)),
      ...[60, 80].map((v) => run('p1', 'skills_anchors', v)),
    ]);

    const text = renderSummary(worse, { date: 'd', threshold: 0.8, anchorCount: 3, model: 'm', runsPerCell: 2, pairs: 1 });

    assert.match(text, /skills_anchors không giảm độ lệch/);
  });

  it('does not make that claim when it did lower it, or when a mode is missing', () => {
    const better = summarize([
      ...[60, 80].map((v) => run('p1', 'skills', v)),
      ...[70, 71].map((v) => run('p1', 'skills_anchors', v)),
    ]);
    const settings = { date: 'd', threshold: 0.8, anchorCount: 3, model: 'm', runsPerCell: 2, pairs: 1 };

    assert.doesNotMatch(renderSummary(better, settings), /không giảm độ lệch/);
    assert.doesNotMatch(renderSummary(rows, settings), /không giảm độ lệch/);
  });
});
