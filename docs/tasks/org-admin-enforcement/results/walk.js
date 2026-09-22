// GĐ1 Tuần 2 operation walk — real HTTP against the rebuilt API container, real Postgres.
//
// Self-checking by construction: every "must NOT see org A" probe is paired with a
// platform-admin CONTROL on the same endpoint that MUST see org A's ids — otherwise an
// empty result would prove nothing (the endpoint might simply return nothing).
//
// Accounts: ONE platform admin is created directly in the local DB (bcrypt of a random
// password generated here, never printed). Everything else — organization B, its
// department, an org_admin for each org, a recruiter in B — is created THROUGH the API as
// that admin, so the create paths are exercised too. Emails end in @walk.local.test.
require(require.resolve('dotenv/config', { paths: [process.cwd()] }));
const crypto = require('crypto');
const { Client } = require(require.resolve('pg', { paths: [process.cwd()] }));
const bcrypt = require(require.resolve('bcrypt', { paths: [process.cwd()] }));
const { io } = require(require.resolve('socket.io-client', { paths: [process.cwd()] }));

const API = 'http://localhost:5000/api';
const ORG_A = '00000000-0000-4000-8000-000000000001';
const PW = `Walk-${crypto.randomBytes(9).toString('base64url')}a1!`;
const dbUrl = new URL(process.env.DATABASE_URL);
dbUrl.hostname = 'localhost';

const out = (s = '') => console.log(s);
const START = new Date(Date.now() - 2000).toISOString();
let failures = 0;
const rows = [];

function collectStrings(v, acc = new Set()) {
  if (typeof v === 'string') acc.add(v);
  else if (Array.isArray(v)) v.forEach((x) => collectStrings(x, acc));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => collectStrings(x, acc));
  return acc;
}

async function call(token, method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json, data: json?.data };
}

// expect: array of acceptable statuses; extra(r) returns '' when fine or a failure reason.
async function probe(who, token, method, path, body, expect, extra) {
  const r = await call(token, method, path, body);
  let reason = expect.includes(r.status) ? '' : `status ${r.status}, expected ${expect.join('/')}`;
  if (!reason && extra) reason = extra(r) || '';
  const msg = r.json && r.json.success === false ? String(r.json.message).slice(0, 70) : '';
  rows.push({ who, req: `${method} ${path}`, status: r.status, ok: !reason, note: reason || msg });
  if (reason) failures++;
  return r;
}

const noneOf = (ids, label) => (r) => {
  const hit = [...collectStrings(r.data)].filter((s) => ids.has(s));
  return hit.length ? `LEAK: ${hit.length} ${label} id(s) of the other organization` : '';
};
const someOf = (ids, label) => (r) =>
  [...collectStrings(r.data)].some((s) => ids.has(s)) ? '' : `CONTROL FAILED: no ${label} id visible`;
const msgHas = (text) => (r) =>
  String(r.json?.message ?? '').includes(text) ? '' : `wrong reason: "${String(r.json?.message ?? '').slice(0, 60)}"`;
const both = (...fs) => (r) => fs.map((f) => f(r)).filter(Boolean).join('; ');

(async () => {
  const db = new Client({ connectionString: dbUrl.toString() });
  await db.connect();
  const ids = async (sql, p = []) => new Set((await db.query(sql, p)).rows.map((r) => r.id));

  // ── setup: the one platform admin, directly in the DB ────────────────────────────
  const hash = bcrypt.hashSync(PW, 10);
  await db.query(
    `INSERT INTO users (user_id, email, password_hash, full_name, role, status, email_verified)
     VALUES (gen_random_uuid()::text, 'walk.platform-admin@walk.local.test', $1, 'Walk Platform Admin', 'admin', 'active', true)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin', status = 'active'`,
    [hash],
  );

  const login = async (email) => {
    const r = await call(null, 'POST', '/auth/login', { email, password: PW });
    if (r.status !== 200 && r.status !== 201) throw new Error(`login ${email}: ${r.status} ${JSON.stringify(r.json)}`);
    return r.data.accessToken;
  };
  const admin = await login('walk.platform-admin@walk.local.test');

  // ── setup through the API, as the platform admin ─────────────────────────────────
  let orgB = (await db.query(`SELECT organization_id id FROM organizations WHERE slug = 'walk-org-b'`)).rows[0]?.id;
  if (!orgB) {
    const r = await probe('platform admin', admin, 'POST', '/organizations', { name: 'Walk Org B', slug: 'walk-org-b' }, [201]);
    orgB = r.data?.organizationId;
  }
  if (!orgB) throw new Error('organization B could not be created');

  // criterion 7 — a platform admin must name the organization
  await probe('platform admin', admin, 'POST', '/departments', { name: 'Walk no-org dept', description: 'walk', color: '#0071E3' }, [400], msgHas('phải chỉ định tổ chức'));
  let deptB = (await db.query(`SELECT department_id id FROM departments WHERE name = 'Walk Dept B' AND organization_id = $1`, [orgB])).rows[0]?.id;
  if (!deptB) {
    const r = await probe('platform admin', admin, 'POST', '/departments', { name: 'Walk Dept B', description: 'walk', color: '#34C759', organizationId: orgB }, [201],
      (r) => (r.data?.organizationId === orgB ? '' : `created in ${r.data?.organizationId}, not B`));
    deptB = r.data?.departmentId;
  }

  // D7 at the service layer: an org_admin needs an organization
  await probe('platform admin', admin, 'POST', '/users',
    { email: 'walk.unbound@walk.local.test', password: PW, fullName: 'Walk Unbound', role: 'org_admin' }, [400], msgHas('phải được gắn với một tổ chức'));

  const ensureUser = async (email, fullName, role, organizationId) => {
    const r = await call(admin, 'POST', '/users', { email, password: PW, fullName, role, status: 'active', ...(organizationId ? { organizationId } : {}) });
    if (r.status === 201) return r.data.userId;
    // already exists from a previous run: reset its password to this run's
    const u = await db.query(`UPDATE users SET password_hash = $2 WHERE email = $1 RETURNING user_id`, [email, hash]);
    if (!u.rowCount) throw new Error(`create ${email}: ${r.status} ${JSON.stringify(r.json)}`);
    return u.rows[0].user_id;
  };
  await ensureUser('walk.orgadmin-b@walk.local.test', 'Walk OrgAdmin B', 'org_admin', orgB);
  await ensureUser('walk.orgadmin-a@walk.local.test', 'Walk OrgAdmin A', 'org_admin', ORG_A);
  const recBUser = await ensureUser('walk.recruiter-b@walk.local.test', 'Walk Recruiter B', 'recruiter');
  const hasRec = await db.query(`SELECT 1 FROM recruiters WHERE user_id = $1`, [recBUser]);
  if (!hasRec.rowCount) {
    await probe('platform admin', admin, 'POST', '/recruiters', { userId: recBUser, departmentId: deptB, position: 'Walk HR' }, [201],
      (r) => (r.data?.organizationId === orgB ? '' : `recruiter stamped ${r.data?.organizationId}, not B`));
  }

  const orgAdminB = await login('walk.orgadmin-b@walk.local.test');
  const orgAdminA = await login('walk.orgadmin-a@walk.local.test');
  const recruiterB = await login('walk.recruiter-b@walk.local.test');

  // ── org A's rows, read from the database ─────────────────────────────────────────
  const A = {
    dept: await ids(`SELECT department_id id FROM departments WHERE organization_id = $1`, [ORG_A]),
    job: await ids(`SELECT job_id id FROM job_postings WHERE organization_id = $1`, [ORG_A]),
    app: await ids(`SELECT application_id id FROM applications WHERE organization_id = $1`, [ORG_A]),
    cfg: await ids(`SELECT config_id id FROM ai_configs WHERE organization_id = $1`, [ORG_A]),
    rec: await ids(`SELECT recruiter_id id FROM recruiters WHERE organization_id = $1`, [ORG_A]),
  };
  const B = {
    dept: await ids(`SELECT department_id id FROM departments WHERE organization_id = $1`, [orgB]),
    cfg: await ids(`SELECT config_id id FROM ai_configs WHERE organization_id = $1`, [orgB]),
    rec: await ids(`SELECT recruiter_id id FROM recruiters WHERE organization_id = $1`, [orgB]),
  };
  const first = (s) => [...s][0];
  const deptA = first(A.dept), jobA = first(A.job), appA = first(A.app), cfgA = first(A.cfg);
  out(`org A rows: ${A.dept.size} departments · ${A.job.size} job postings · ${A.app.size} applications · ${A.cfg.size} AI configs · ${A.rec.size} recruiters`);
  out(`org B rows: ${B.dept.size} departments · ${B.cfg.size} AI configs (default created with the org) · ${B.rec.size} recruiters`);
  out('');

  // ── org_admin of B, against org A ────────────────────────────────────────────────
  const oB = 'org_admin B';
  await probe(oB, orgAdminB, 'GET', '/organizations', null, [403]);
  await probe(oB, orgAdminB, 'GET', '/organizations/me', null, [200], (r) => (r.data?.organizationId === orgB ? '' : 'not its own org'));
  await probe(oB, orgAdminB, 'GET', '/departments', null, [200], both(noneOf(A.dept, 'department'), someOf(B.dept, 'own department')));
  await probe(oB, orgAdminB, 'GET', `/departments/${deptA}`, null, [404], msgHas('Không tìm thấy'));
  await probe(oB, orgAdminB, 'PATCH', `/departments/${deptA}`, { name: 'hijack' }, [403, 404]);
  await probe(oB, orgAdminB, 'POST', '/departments', { name: 'Walk cross-org', description: 'walk', color: '#FF9500', organizationId: ORG_A }, [403], msgHas('tổ chức khác'));
  await probe(oB, orgAdminB, 'GET', '/recruiters', null, [200], both(noneOf(A.rec, 'recruiter'), someOf(B.rec, 'own recruiter')));
  await probe(oB, orgAdminB, 'GET', '/ai-config', null, [200], both(noneOf(A.cfg, 'AI config'), someOf(B.cfg, 'own AI config')));
  await probe(oB, orgAdminB, 'GET', `/ai-config/${cfgA}`, null, [404]);
  await probe(oB, orgAdminB, 'PATCH', `/ai-config/${cfgA}/set-default`, null, [404]);
  await probe(oB, orgAdminB, 'GET', '/job-postings', null, [200], noneOf(A.job, 'job posting'));
  await probe(oB, orgAdminB, 'GET', `/job-postings/${jobA}`, null, [404]);
  await probe(oB, orgAdminB, 'GET', `/applications/${appA}`, null, [403], msgHas('tổ chức khác'));
  await probe(oB, orgAdminB, 'GET', '/applications/board/all', null, [200], noneOf(A.app, 'application'));
  await probe(oB, orgAdminB, 'GET', `/applications/board/${jobA}`, null, [403, 404]);
  await probe(oB, orgAdminB, 'GET', '/users', null, [403]);
  await probe(oB, orgAdminB, 'GET', '/skills', null, [200, 403]); // taxonomy reads are not org data; recorded, not judged

  // ── recruiter of B, against org A ────────────────────────────────────────────────
  const rB = 'recruiter B';
  await probe(rB, recruiterB, 'GET', `/job-postings/${jobA}`, null, [404]);
  await probe(rB, recruiterB, 'GET', `/applications/${appA}`, null, [403], msgHas('tổ chức khác'));
  await probe(rB, recruiterB, 'GET', '/recruiters', null, [200], noneOf(A.rec, 'recruiter'));
  await probe(rB, recruiterB, 'GET', '/applications/board/all', null, [200], noneOf(A.app, 'application'));
  // F1 — privilege escalation through PATCH /users/me
  await probe(rB, recruiterB, 'PATCH', '/users/me', { role: 'admin' }, [400]);
  await probe(rB, recruiterB, 'PATCH', '/users/me', { organizationId: ORG_A }, [400]);
  await probe(rB, recruiterB, 'PATCH', '/users/me', { fullName: 'Walk Recruiter B' }, [200]); // control: the endpoint itself works
  const roleNow = (await db.query(`SELECT role::text r, organization_id o FROM users WHERE user_id = $1`, [recBUser])).rows[0];
  const escalated = roleNow.r !== 'recruiter' || roleNow.o !== null;
  rows.push({ who: rB, req: 'DB: users row after the PATCHes', status: '-', ok: !escalated, note: `role=${roleNow.r}, organization_id=${roleNow.o}` });
  if (escalated) failures++;

  // ── org_admin of A — the positive side and the reverse direction ─────────────────
  const oA = 'org_admin A';
  await probe(oA, orgAdminA, 'GET', `/applications/${appA}`, null, [200]);
  await probe(oA, orgAdminA, 'GET', `/job-postings/${jobA}`, null, [200]);
  await probe(oA, orgAdminA, 'GET', '/departments', null, [200], both(someOf(A.dept, 'own department'), noneOf(B.dept, 'department')));
  await probe(oA, orgAdminA, 'GET', `/departments/${first(B.dept)}`, null, [403, 404]);

  // ── platform admin — the CONTROLS: sees both organizations ───────────────────────
  const pa = 'platform admin';
  await probe(pa, admin, 'GET', '/departments', null, [200], both(someOf(A.dept, 'org A department'), someOf(B.dept, 'org B department')));
  await probe(pa, admin, 'GET', '/ai-config', null, [200], both(someOf(A.cfg, 'org A config'), someOf(B.cfg, 'org B config')));
  await probe(pa, admin, 'GET', '/recruiters', null, [200], both(someOf(A.rec, 'org A recruiter'), someOf(B.rec, 'org B recruiter')));
  await probe(pa, admin, 'GET', '/applications/board/all', null, [200], someOf(A.app, 'org A application'));
  await probe(pa, admin, 'GET', '/job-postings', null, [200], someOf(A.job, 'org A job posting'));
  await probe(pa, admin, 'GET', `/applications/${appA}`, null, [200]);
  await probe(pa, admin, 'GET', '/organizations', null, [200], (r) => ([...collectStrings(r.data)].includes(orgB) ? '' : 'org B missing'));

  // ── anonymous — public browsing is unchanged ─────────────────────────────────────
  await probe('anonymous', null, 'GET', '/job-postings', null, [200]);

  // ── socket: join_job_room on an org A job ────────────────────────────────────────
  const socketJoin = (token) => new Promise((resolve) => {
    const s = io('http://localhost:5000', { auth: { token: `Bearer ${token}` }, transports: ['websocket'], reconnection: false, extraHeaders: { origin: process.env.CLIENT_URL } });
    const done = (v) => { s.close(); resolve(v); };
    // Wait for the server's async handshake (JWT verify + DB read) before joining: a join that
    // arrives first is refused for having no user yet, which would look exactly like an
    // organization refusal. The log order (user room first) is checked afterwards.
    s.on('connect', () => setTimeout(() => { s.emit('join_job_room', { jobId: jobA }); setTimeout(() => done(s.id), 800); }, 1000));
    s.on('connect_error', (e) => done(`connect_error ${e.message}`));
    setTimeout(() => done('timeout'), 5000);
  });
  const sockets = {
    [oB]: await socketJoin(orgAdminB),
    [rB]: await socketJoin(recruiterB),
    [oA]: await socketJoin(orgAdminA),
    [pa]: await socketJoin(admin),
  };
  out('SOCKET_IDS ' + JSON.stringify({ jobA, ...sockets }));

  // join_job_room answers nothing to the client — the decision is only in the API's log. Read
  // this run's log and judge each socket. The handshake line (`joined room: user_…`) must come
  // BEFORE the job-room decision, or the decision was the handshake race, not the rule.
  await new Promise((r) => setTimeout(r, 1000));
  const { execSync } = require('child_process');
  const log = execSync(`docker logs ats-api --since ${START} 2>&1`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .replace(/\u001b\[[0-9;]*m/g, '').split(/\r?\n/);
  const expectJoin = { [oB]: false, [rB]: false, [oA]: true, [pa]: true };
  for (const [who, id] of Object.entries(sockets)) {
    const lines = log.filter((l) => l.includes(id));
    const handshake = lines.findIndex((l) => l.includes('joined room: user_'));
    const decision = lines.findIndex((l) => l.includes(`job_${jobA}`));
    const joined = decision >= 0 && lines[decision].includes('joined room: job_');
    let reason = '';
    if (decision < 0) reason = 'no job-room decision in the API log';
    else if (handshake < 0 || decision < handshake) reason = 'decided before the handshake finished (race) — not a reading';
    else if (joined !== expectJoin[who]) reason = `${joined ? 'joined' : 'refused'}, expected ${expectJoin[who] ? 'joined' : 'refused'}`;
    rows.push({ who, req: `socket join_job_room (org A job)`, status: '-', ok: !reason, note: reason || (joined ? 'joined' : 'refused') });
    if (reason) failures++;
  }

  await db.end();

  out('| who | request | status | verdict | note |');
  out('|---|---|---:|---|---|');
  for (const r of rows) out(`| ${r.who} | \`${r.req}\` | ${r.status} | ${r.ok ? 'PASS' : '**FAIL**'} | ${r.note} |`);
  out('');
  out(failures === 0 ? `RESULT: ${rows.length} checks, all passed` : `RESULT: ${failures} of ${rows.length} checks FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error('WALK ABORTED:', e.message); process.exit(2); });
