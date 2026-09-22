// Verifies users_org_admin_binding_check on the LOCAL database. Every probe runs inside
// a transaction (via SAVEPOINTs) that is rolled back — nothing is left behind.
require(require.resolve('dotenv/config', { paths: [process.cwd()] }));
const { Client } = require(require.resolve('pg', { paths: [process.cwd()] }));
const url = new URL(process.env.DATABASE_URL);
url.hostname = 'localhost';
const ORG = '00000000-0000-4000-8000-000000000001';

(async () => {
  const c = new Client({ connectionString: url.toString() });
  await c.connect();
  const out = (s) => console.log(s);
  let failures = 0;

  const def = await c.query(
    `SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conname = 'users_org_admin_binding_check'`,
  );
  out(`constraint present: ${def.rowCount === 1} — ${def.rows[0]?.def ?? '(missing)'}`);
  if (def.rowCount !== 1) failures++;

  const enumVals = await c.query(`SELECT unnest(enum_range(NULL::user_role))::text AS v`);
  out(`user_role values: ${enumVals.rows.map((r) => r.v).join(', ')}`);

  const existing = await c.query(`SELECT role::text, count(*)::int n,
      count(*) FILTER (WHERE organization_id IS NOT NULL)::int bound FROM users GROUP BY role ORDER BY role`);
  out('existing users by role (n / bound to an organization):');
  for (const r of existing.rows) out(`  ${r.role}: ${r.n} / ${r.bound}`);

  const probe = async (label, sql, params, expectReject) => {
    await c.query('SAVEPOINT p');
    try {
      await c.query(sql, params);
      const ok = !expectReject;
      out(`${ok ? 'PASS' : 'FAIL'} — ${label}: accepted`);
      if (!ok) failures++;
    } catch (e) {
      const ok = expectReject && e.code === '23514';
      out(`${ok ? 'PASS' : 'FAIL'} — ${label}: rejected (${e.code} ${e.constraint ?? e.message})`);
      if (!ok) failures++;
    }
    await c.query('ROLLBACK TO SAVEPOINT p');
  };

  const ins = `INSERT INTO users (user_id, email, password_hash, full_name, role, organization_id)
               VALUES (gen_random_uuid()::text, $1, 'x', 'probe', $2::user_role, $3)`;

  await c.query('BEGIN');
  await probe('org_admin WITHOUT organization', ins, ['probe1@local.test', 'org_admin', null], true);
  await probe('recruiter WITH organization', ins, ['probe2@local.test', 'recruiter', ORG], true);
  await probe('candidate WITH organization', ins, ['probe3@local.test', 'candidate', ORG], true);
  // Controls — the constraint must not reject the valid shapes, or the rejections above prove nothing.
  await probe('CONTROL org_admin WITH organization', ins, ['probe4@local.test', 'org_admin', ORG], false);
  await probe('CONTROL recruiter WITHOUT organization', ins, ['probe5@local.test', 'recruiter', null], false);
  await c.query('ROLLBACK');

  const left = await c.query(`SELECT count(*)::int n FROM users WHERE email LIKE 'probe%@local.test'`);
  out(`probe rows left behind: ${left.rows[0].n}`);
  if (left.rows[0].n !== 0) failures++;

  await c.end();
  out(failures === 0 ? 'RESULT: all checks passed' : `RESULT: ${failures} failure(s)`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error(e.message); process.exit(2); });
