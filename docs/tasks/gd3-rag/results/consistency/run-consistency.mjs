// GĐ3 consistency measurement: score the same CV–job pairs repeatedly in each RAG mode, then summarise the spread.
//
//   node run-consistency.mjs --dry-run                       # prints the plan; calls nothing
//   node run-consistency.mjs --model <name> --threshold 0.8 --anchor-count 3   # REAL AI CALLS — see below
//
// A real run needs:
//   - DATABASE_URL and (optionally) REDIS_URL in the environment of the *isolated test stack*
//     (docker-compose.test.yml: Postgres on 55432, Redis on 56379). The script never reads `.env`.
//   - the API container running with a valid OPENAI_API_KEY (the worker lives there, not here),
//   - a dataset.json the project owner approved (see dataset.md).
// Each run overwrites the pair's screening row (a screening is unique per application) and re-queues it with a
// forced `ragMode`, so use dedicated seed applications, never real ones.
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { MODES, renderSummary, summarize } from './stats.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const POLL_MS = 2000;
const RUN_TIMEOUT_MS = 5 * 60 * 1000;
const NUMBER_FLAGS = { '--threshold': 'threshold', '--anchor-count': 'anchorCount', '--pairs-count': 'pairsCount' };
const TEXT_FLAGS = { '--dataset': 'dataset', '--out': 'out', '--model': 'model' };

export function parseArgs(argv) {
  const args = {
    dryRun: false,
    runs: 5,
    modes: [...MODES],
    dataset: path.join(HERE, 'dataset.json'),
    out: HERE,
    model: undefined,
    threshold: undefined,
    anchorCount: undefined,
    pairsCount: 10,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--dry-run') {
      args.dryRun = true;
    } else if (flag === '--runs') {
      const runs = Number(argv[(i += 1)]);
      if (!Number.isInteger(runs) || runs < 1) throw new Error('--runs must be a positive integer');
      args.runs = runs;
    } else if (flag === '--modes') {
      args.modes = String(argv[(i += 1)]).split(',');
    } else if (flag in NUMBER_FLAGS) {
      const value = Number(argv[(i += 1)]);
      if (!Number.isFinite(value)) throw new Error(`${flag} must be a number`);
      args[NUMBER_FLAGS[flag]] = value;
    } else if (flag in TEXT_FLAGS) {
      args[TEXT_FLAGS[flag]] = argv[(i += 1)];
    } else {
      throw new Error(`Unknown option ${flag}`);
    }
  }
  return args;
}

/**
 * The ordered list of jobs. Run 1 of every pair × mode happens before run 2 of any, so a provider
 * that drifts during the afternoon drifts for all three modes alike instead of favouring one.
 */
export function buildPlan(pairs, modes, runs) {
  if (pairs.length === 0) throw new Error('No pairs in the dataset');
  if (!Number.isInteger(runs) || runs < 1) throw new Error('runs must be a positive integer');
  for (const mode of modes) {
    if (!MODES.includes(mode)) throw new Error(`Unknown mode "${mode}"`);
  }
  for (const pair of pairs) {
    for (const key of ['pairId', 'screeningId', 'cvId', 'applicationId', 'configId']) {
      if (!pair[key]) throw new Error(`Pair ${pair.pairId ?? '?'} is missing ${key}`);
    }
  }

  const plan = [];
  for (let run = 1; run <= runs; run += 1) {
    for (const pair of pairs) {
      for (const mode of modes) {
        plan.push({
          pairId: pair.pairId,
          mode,
          run,
          data: {
            screeningId: pair.screeningId,
            cvId: pair.cvId,
            applicationId: pair.applicationId,
            configId: pair.configId,
            notify: false,
            ragMode: mode,
          },
        });
      }
    }
  }
  return plan;
}

function printPlan(plan, args, pairCount, placeholder) {
  const perMode = Object.fromEntries(args.modes.map((m) => [m, plan.filter((j) => j.mode === m).length]));
  const withEmbeddings = plan.filter((j) => j.mode !== 'none').length;
  console.log(`Kế hoạch (${placeholder ? 'DRY RUN, dataset giả định' : 'dry run'}):`);
  console.log(`  ${pairCount} cặp × ${args.modes.length} chế độ × ${args.runs} lần = ${plan.length} lượt chạy, tuần tự`);
  for (const [mode, count] of Object.entries(perMode)) console.log(`  - ${mode}: ${count} lượt`);
  console.log(`  Gọi AI thật nếu chạy: ${plan.length} lần chấm điểm (LLM), và embedding ở ${withEmbeddings} lượt (skills / skills_anchors)`);
  console.log('  Chưa gọi gì cả. Ước tính chi phí bằng cách nhân số lần trên với giá model hiện hành trước khi chạy thật.');
}

async function loadDataset(file) {
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  return JSON.parse(text);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dataset = await loadDataset(args.dataset);

  if (args.dryRun) {
    const pairs =
      dataset ??
      Array.from({ length: args.pairsCount }, (_, i) => ({
        pairId: `p${i + 1}`,
        screeningId: 's',
        cvId: 'c',
        applicationId: 'a',
        configId: 'x',
      }));
    printPlan(buildPlan(pairs, args.modes, args.runs), args, pairs.length, dataset === null);
    return;
  }

  if (!dataset) throw new Error(`No dataset at ${args.dataset}. Create it from dataset.md once the owner approves the pairs.`);
  for (const key of ['model', 'threshold', 'anchorCount']) {
    if (args[key] === undefined) {
      throw new Error(`--${key === 'anchorCount' ? 'anchor-count' : key} is required: the summary records what the API actually ran with`);
    }
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set (point it at the isolated test stack)');

  const plan = buildPlan(dataset, args.modes, args.runs);
  // Resolve libraries from where the command is run (the repo root), not from this file's folder.
  const require = createRequire(path.join(process.cwd(), 'package.json'));
  const { Queue } = require('bullmq');
  const IORedis = require('ioredis');
  const { Client } = require('pg');

  const redis = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:56379', { maxRetriesPerRequest: null });
  const queue = new Queue('cv-screening', { connection: redis });
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  const results = [];
  try {
    for (const [index, job] of plan.entries()) {
      const row = await runOnce(db, queue, job);
      results.push({ pairId: job.pairId, mode: job.mode, run: job.run, actualMode: row.rag_mode, ...scores(row) });
      await mkdir(args.out, { recursive: true });
      await writeFile(path.join(args.out, 'runs.json'), JSON.stringify(results, null, 2));
      console.log(`[${index + 1}/${plan.length}] ${job.pairId} ${job.mode} #${job.run} → overall ${row.overall_score}`);

      if (row.rag_mode !== job.mode) {
        throw new Error(
          `Pair ${job.pairId}: asked for "${job.mode}" but the processor ran "${row.rag_mode}" (degraded). ` +
            'This cell does not measure what it claims — stopping. runs.json keeps the runs so far.',
        );
      }
    }
  } finally {
    await queue.close();
    await redis.quit();
    await db.end();
  }

  const summary = renderSummary(summarize(results), {
    date: new Date().toISOString().slice(0, 10),
    threshold: args.threshold,
    anchorCount: args.anchorCount,
    model: args.model,
    runsPerCell: args.runs,
    pairs: dataset.length,
  });
  await writeFile(path.join(args.out, 'summary.md'), summary);
  console.log(`Đã ghi runs.json và summary.md vào ${args.out}`);
}

const scores = (row) => ({
  skills: Number(row.skills_score),
  experience: Number(row.experience_score),
  education: Number(row.education_score),
  overall: Number(row.overall_score),
});

async function runOnce(db, queue, job) {
  // The row is unique per application: clear the previous result so a stale "completed" is never mistaken for this run.
  await db.query(
    `UPDATE cv_screenings
        SET status = 'processing', overall_score = NULL, skills_score = NULL, experience_score = NULL,
            education_score = NULL, rag_mode = NULL, error_log = NULL, screened_at = NULL
      WHERE screening_id = $1`,
    [job.data.screeningId],
  );
  await queue.add('process-cv-screening', job.data);

  const deadline = Date.now() + RUN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    const { rows } = await db.query(
      `SELECT status, overall_score, skills_score, experience_score, education_score, rag_mode, error_log
         FROM cv_screenings WHERE screening_id = $1`,
      [job.data.screeningId],
    );
    const row = rows[0];
    if (row?.status === 'completed') return row;
    if (row?.status === 'failed') throw new Error(`Pair ${job.pairId} ${job.mode} #${job.run} failed: ${row.error_log}`);
  }
  throw new Error(`Pair ${job.pairId} ${job.mode} #${job.run} did not finish in ${RUN_TIMEOUT_MS / 1000}s`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
