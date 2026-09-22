// Probe: "one default AI config per ORGANIZATION" (decision.md D11), against the LOCAL database.
//
//   node docs/tasks/org-admin-enforcement/results/probe-one-default-per-org.js   (from the repo root)
//
// Everything runs inside one transaction that is rolled back — nothing is left behind.
// DATABASE_URL in .env names the Docker-internal host `postgres`; it is rewritten to
// localhost in-process so the secret is never printed.
require('dotenv/config');
const { Client } = require('pg');

const ORG_A = '00000000-0000-4000-8000-000000000001';

(async () => {
  const url = new URL(process.env.DATABASE_URL);
  url.hostname = 'localhost';
  const c = new Client({ connectionString: url.toString() });
  await c.connect();
  let failures = 0;

  const idx = await c.query(
    `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'ai_configs' AND indexdef LIKE '%WHERE%'`,
  );
  console.log('partial unique indexes on ai_configs:');
  for (const r of idx.rows) console.log(`  ${r.indexname}: ${r.indexdef.replace(/^CREATE UNIQUE INDEX \S+ ON public\./, '')}`);

  const insertDefault = (orgId) =>
    c.query(
      `INSERT INTO ai_configs (config_id, organization_id, name, is_default, skills_weight,
                               experience_weight, education_weight, minimum_score_threshold)
       VALUES (gen_random_uuid()::text, $1, 'probe default', true, 0.4, 0.4, 0.2, 60)`,
      [orgId],
    );

  const probe = async (label, run, expectAccepted) => {
    await c.query('SAVEPOINT p');
    try {
      await run();
      console.log(`${expectAccepted ? 'PASS' : 'FAIL'} — ${label}: accepted`);
      if (!expectAccepted) failures++;
    } catch (e) {
      // Only a unique violation on a default-config index counts as "rejected for the
      // right reason" — a NOT NULL or FK error would look the same from outside.
      const rightReason = e.code === '23505' && /default/.test(e.constraint ?? '');
      const ok = !expectAccepted && rightReason;
      console.log(`${ok ? 'PASS' : 'FAIL'} — ${label}: rejected (${e.code} ${e.constraint ?? e.message})`);
      if (!ok) failures++;
    }
    await c.query('ROLLBACK TO SAVEPOINT p');
  };

  await c.query('BEGIN');
  const orgX = (
    await c.query(
      `INSERT INTO organizations (organization_id, name, slug)
       VALUES (gen_random_uuid()::text, 'Probe Org', 'probe-org-' || substr(md5(random()::text), 1, 8))
       RETURNING organization_id`,
    )
  ).rows[0].organization_id;

  // The behaviour under test: a second organization can hold its own default.
  await probe('a default in a SECOND organization, while org A has one', () => insertDefault(orgX), true);
  // The invariant that must survive: still only one default inside one organization.
  await probe('CONTROL a second default inside org A', () => insertDefault(ORG_A), false);
  await c.query('ROLLBACK');

  const left = await c.query(`SELECT count(*)::int n FROM organizations WHERE slug LIKE 'probe-org-%'`);
  console.log(`probe rows left behind: ${left.rows[0].n}`);
  if (left.rows[0].n !== 0) failures++;

  await c.end();
  console.log(failures === 0 ? 'RESULT: all checks passed' : `RESULT: ${failures} failure(s)`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
  console.error(e.message);
  process.exit(2);
});
