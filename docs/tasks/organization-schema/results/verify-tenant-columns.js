// GĐ1 Tuần 1 — re-runnable verification of the tenant columns, against the LOCAL database.
//
//   node docs/tasks/organization-schema/results/verify-tenant-columns.js   (from the repo root)
//
// Read-only except two probes, each inside a transaction that is rolled back.
// DATABASE_URL in .env names the Docker-internal host `postgres`; it is rewritten to
// localhost in-process so the secret is never printed.
//
// Changed from the original 2026-09-13 run: that run also required "exactly one organization",
// true before Tuần 2 and deliberately false after it (Tuần 2 creates more), so it now only
// requires the seed organization to exist. And criterion 5 must now be rejected for the RIGHT
// reason — a NOT NULL violation on organization_id — not merely rejected.
require('dotenv/config');
const { Client } = require('pg');

const SEED_ORG = '00000000-0000-4000-8000-000000000001';
const ORG_SCOPED = ['departments', 'recruiters', 'job_postings', 'job_posting_skills',
  'applications', 'application_history', 'cv_screenings', 'ai_configs', 'interview_schedules'];

// child table -> [parent table, join column]
const PAIRS = [
  ['recruiters', 'departments', 'department_id'],
  ['job_postings', 'departments', 'department_id'],
  ['job_posting_skills', 'job_postings', 'job_id'],
  ['applications', 'job_postings', 'job_id'],
  ['application_history', 'applications', 'application_id'],
  ['cv_screenings', 'applications', 'application_id'],
  ['interview_schedules', 'applications', 'application_id'],
];

(async () => {
  const url = new URL(process.env.DATABASE_URL);
  url.hostname = 'localhost';
  const c = new Client({ connectionString: url.toString() });
  await c.connect();
  let failures = 0;
  const line = (s = '') => console.log(s);

  line('## Criterion 1 — no row left with a null organization_id');
  line('');
  line('| table | rows | null org_id | verdict |');
  line('|---|---:|---:|---|');
  for (const t of ORG_SCOPED) {
    const { rows } = await c.query(
      `SELECT count(*)::int AS total, count(*) FILTER (WHERE organization_id IS NULL)::int AS nulls FROM "${t}"`);
    const ok = rows[0].nulls === 0;
    if (!ok) failures++;
    line(`| \`${t}\` | ${rows[0].total} | ${rows[0].nulls} | ${ok ? 'PASS' : 'FAIL'} |`);
  }

  line('');
  line('## Criterion 2 — no child disagrees with its parent');
  line('');
  line('| child | parent | disagreements | verdict |');
  line('|---|---|---:|---|');
  for (const [child, parent, col] of PAIRS) {
    const { rows } = await c.query(
      `SELECT count(*)::int AS bad FROM "${child}" ch JOIN "${parent}" p USING ("${col}")
        WHERE ch.organization_id <> p.organization_id`);
    const ok = rows[0].bad === 0;
    if (!ok) failures++;
    line(`| \`${child}\` | \`${parent}\` | ${rows[0].bad} | ${ok ? 'PASS' : 'FAIL'} |`);
  }

  line('');
  line('## Organizations');
  line('');
  const orgs = await c.query('SELECT organization_id, name, slug FROM organizations ORDER BY created_at');
  line('| organization_id | name | slug |');
  line('|---|---|---|');
  for (const o of orgs.rows) line(`| \`${o.organization_id}\` | ${o.name} | \`${o.slug}\` |`);
  const seedPresent = orgs.rows.some((o) => o.organization_id === SEED_ORG);
  if (!seedPresent) failures++;
  line('');
  line(`Seed organization present: **${seedPresent ? 'PASS' : 'FAIL'}** (${orgs.rows.length} organization(s) in total)`);

  line('');
  line('## Criterion 5 — a null organization_id is rejected by the database');
  line('');
  await c.query('BEGIN');
  let verdict = 'ACCEPTED — criterion 5 FAILED';
  let ok5 = false;
  try {
    await c.query(`INSERT INTO departments (department_id, name) VALUES (gen_random_uuid(), 'verify-probe')`);
  } catch (e) {
    ok5 = e.code === '23502' && e.column === 'organization_id';
    verdict = `REJECTED (${e.code}, column ${e.column ?? '?'})${ok5 ? '' : ' — but for the wrong reason'}`;
  }
  await c.query('ROLLBACK');
  if (!ok5) failures++;
  line('```');
  line(`INSERT INTO departments (department_id, name) VALUES (gen_random_uuid(), 'verify-probe');`);
  line(`-> ${verdict}`);
  line('```');
  line('');
  line(`Verdict: **${ok5 ? 'PASS' : 'FAIL'}** (rolled back either way)`);

  line('');
  line('## Criterion 6 — candidate_skills exists and its enum column works');
  line('');
  const cnt = await c.query('SELECT count(*)::int AS n FROM candidate_skills');
  const enumVals = await c.query(
    `SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS vals
       FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typname = 'candidate_skill_source'`);
  line(`- \`candidate_skills\` is queryable — ${cnt.rows[0].n} rows`);
  line(`- \`candidate_skill_source\` accepts: \`${enumVals.rows[0].vals}\``);

  await c.query('BEGIN');
  let inserted = 'skipped — no candidate/skill row to attach to';
  const parents = await c.query(
    `SELECT (SELECT candidate_id FROM candidates LIMIT 1) AS cid, (SELECT skill_id FROM skills LIMIT 1) AS sid`);
  if (parents.rows[0].cid && parents.rows[0].sid) {
    const ins = await c.query(
      `INSERT INTO candidate_skills (candidate_skill_id, candidate_id, skill_id, source)
       VALUES (gen_random_uuid(), $1, $2, 'cv_parsed') RETURNING source`,
      [parents.rows[0].cid, parents.rows[0].sid]);
    inserted = `inserted and read back: source = ${ins.rows[0].source}`;
  }
  await c.query('ROLLBACK');
  line(`- real insert probe: ${inserted} (rolled back)`);

  line('');
  line(`## Overall: ${failures === 0 ? '**ALL CHECKS PASS**' : `**${failures} CHECK(S) FAILED**`}`);
  await c.end();
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
  console.error('verify script error:', e.message);
  process.exit(2);
});
