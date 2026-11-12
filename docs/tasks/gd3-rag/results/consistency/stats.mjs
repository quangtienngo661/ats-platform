// Consistency statistics for the GĐ3 measurement: the same CV scored several times in each RAG mode.
// Pure functions, no I/O: `run-consistency.mjs` collects the runs, this file turns them into numbers.

export const MODES = ['none', 'skills', 'skills_anchors'];
export const FIELDS = ['skills', 'experience', 'education', 'overall'];

const round2 = (value) => value.toFixed(2);

// Population standard deviation (divide by n): the runs ARE the whole set being described.
function stdev(values) {
  if (values.length < 2) return 0;
  // Exact 0 for identical scores — the arithmetic below can leave a rounding crumb.
  if (values.every((v) => v === values[0])) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function assertRun(run) {
  if (!MODES.includes(run.mode)) {
    throw new Error(`Unknown mode "${run.mode}" (pair ${run.pairId})`);
  }
  const bad = FIELDS.filter((field) => !Number.isFinite(run[field]));
  if (bad.length > 0) {
    throw new Error(`Non-finite score in ${bad.join(', ')} (pair ${run.pairId}, mode ${run.mode})`);
  }
}

/**
 * runs: [{ pairId, mode, skills, experience, education, overall }]
 * → one row per mode × field: the standard deviation of a pair's repeated scores,
 *   averaged over pairs (meanStdev) and its worst pair (maxStdev).
 */
export function summarize(runs) {
  runs.forEach(assertRun);

  const rows = [];
  for (const mode of MODES) {
    const inMode = runs.filter((r) => r.mode === mode);
    if (inMode.length === 0) continue;
    const pairIds = [...new Set(inMode.map((r) => r.pairId))];

    for (const field of FIELDS) {
      const perPair = pairIds.map((pairId) =>
        stdev(inMode.filter((r) => r.pairId === pairId).map((r) => r[field])),
      );
      rows.push({
        mode,
        field,
        meanStdev: perPair.reduce((sum, v) => sum + v, 0) / perPair.length,
        maxStdev: Math.max(...perPair),
      });
    }
  }
  return rows;
}

const overallOf = (rows, mode) => rows.find((r) => r.mode === mode && r.field === 'overall');

export function renderSummary(rows, settings) {
  const { date, threshold, anchorCount, model, runsPerCell, pairs } = settings;
  const lines = [
    '# Đo độ nhất quán điểm sàng lọc CV',
    '',
    `- Ngày chạy: ${date}`,
    `- Model: ${model}`,
    `- τ (SKILL_MATCH_THRESHOLD): ${threshold}`,
    `- k (ANCHOR_COUNT): ${anchorCount}`,
    `- Số cặp CV–job: ${pairs}; số lần chạy mỗi cặp mỗi chế độ: ${runsPerCell}`,
    '',
    '| Chế độ | Trường | Độ lệch chuẩn TB | Độ lệch chuẩn lớn nhất |',
    '|---|---|---|---|',
    ...rows.map((r) => `| ${r.mode} | ${r.field} | ${round2(r.meanStdev)} | ${round2(r.maxStdev)} |`),
    '',
  ];

  const skills = overallOf(rows, 'skills');
  const anchors = overallOf(rows, 'skills_anchors');
  if (skills && anchors && anchors.meanStdev >= skills.meanStdev) {
    lines.push(
      `> skills_anchors không giảm độ lệch so với skills (${round2(anchors.meanStdev)} so với ${round2(skills.meanStdev)}, ` +
        'điểm tổng, độ lệch chuẩn TB). Số liệu giữ nguyên, không chỉnh.',
      '',
    );
  }
  return lines.join('\n');
}
