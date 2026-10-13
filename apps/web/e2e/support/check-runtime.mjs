// Runtime probes against docker-compose.test.yml. Not part of default unit tests.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import pg from 'pg';
import bcrypt from 'bcrypt';
import { io } from 'socket.io-client';

const api = 'http://localhost:55000/api';
const fixture = JSON.parse(await readFile('docs/tasks/test-defect-fixes/results/local-fixture.json', 'utf8'));
const pool = new pg.Pool({ connectionString: 'postgresql://ats_test:ats-local-test@localhost:55432/ats_test' });
const command = promisify(execFile);
const ids = Object.fromEntries(['orgB', 'department', 'adminA', 'adminB', 'recruiterUser', 'recruiter', 'job', 'cv', 'parsed'].map(key => [key, randomUUID()]));
const sessions = [];
const sockets = [];
const checks = [];
const passwordHash = await bcrypt.hash('Runtime@123', 10);
let applicationId;
let success = false;

async function login(email, password) {
  const response = await fetch(`${api}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 201, `Login failed with HTTP ${response.status}`);
  const token = (await response.json()).data.accessToken;
  const cookie = response.headers.getSetCookie().find(value => value.startsWith('refreshToken='))?.split(';')[0];
  const session = { token, cookie };
  sessions.push(session);
  return session;
}
function call(method, path, session, data) {
  return fetch(api + path, {
    method, headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' },
    ...(data ? { body: JSON.stringify(data) } : {}),
    signal: AbortSignal.timeout(5_000),
  });
}
async function expectedConstraint(sql, args, errorCode) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let caught;
    try { await client.query(sql, args); } catch (error) { caught = error.code; }
    assert.equal(caught, errorCode);
  } finally {
    await client.query('ROLLBACK');
    client.release();
  }
}
async function connectAndJoin(session) {
  const socket = io('http://localhost:55000', {
    autoConnect: false, transports: ['websocket'], reconnection: false,
    auth: { token: session.token }, extraHeaders: { Origin: 'http://localhost:3000' },
  });
  sockets.push(socket);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Socket connect timed out')), 5_000);
    socket.once('connect_error', error => { clearTimeout(timer); reject(error); });
    socket.once('connect', () => {
      socket.emit('join_job_room', { jobId: ids.job });
      clearTimeout(timer);
      resolve();
    });
    socket.connect();
  });
  return socket;
}
try {
  assert.equal((await pool.query('SELECT current_database() AS name')).rows[0].name, 'ats_test');
  await pool.query('INSERT INTO organizations (organization_id,name,slug) VALUES ($1,$2,$3)', [ids.orgB, 'Runtime organization B', `runtime-${ids.orgB}`]);
  await pool.query('INSERT INTO departments (department_id,organization_id,name) VALUES ($1,$2,$3)', [ids.department, fixture.organizationId, 'Runtime test department']);
  for (const [id, role, org] of [[ids.adminA, 'org_admin', fixture.organizationId], [ids.adminB, 'org_admin', ids.orgB], [ids.recruiterUser, 'recruiter', null]]) {
    await pool.query('INSERT INTO users (user_id,email,password_hash,full_name,role,email_verified,organization_id) VALUES ($1,$2,$3,$4,$5,true,$6)', [id, `${id}@ats.test`, passwordHash, 'Runtime test user', role, org]);
  }
  await pool.query('INSERT INTO recruiters (recruiter_id,user_id,organization_id,department_id) VALUES ($1,$2,$3,$4)', [ids.recruiter, ids.recruiterUser, fixture.organizationId, ids.department]);
  await pool.query("INSERT INTO job_postings (job_id,organization_id,department_id,created_by,title,location_type,status) VALUES ($1,$2,$3,$4,'Runtime test job','remote','active')", [ids.job, fixture.organizationId, ids.department, ids.recruiter]);
  const candidate = (await pool.query("SELECT candidate_id FROM candidates JOIN users USING(user_id) WHERE email='candidate-e2e@ats.test'")).rows[0];
  assert.ok(candidate);
  await pool.query("INSERT INTO cvs (cv_id,candidate_id,file_name,file_path,raw_text,parsing_status) VALUES ($1,$2,'runtime.pdf','/test/runtime.pdf','Fixture CV','completed')", [ids.cv, candidate.candidate_id]);
  await pool.query('INSERT INTO cv_parsed_data (id,cv_id,is_confirmed) VALUES ($1,$2,true)', [ids.parsed, ids.cv]);

  await expectedConstraint(
    "INSERT INTO users (user_id,email,password_hash,full_name,role,email_verified) VALUES ($1,$2,$3,'Invalid admin','org_admin',true)",
    [randomUUID(), `invalid-${randomUUID()}@ats.test`, passwordHash], '23514',
  );
  checks.push({ check: 'org_admin requires organization binding', sqlState: '23514', passed: true });
  await expectedConstraint(
    "INSERT INTO ai_configs (config_id,organization_id,name,is_default,skills_weight,experience_weight,education_weight,minimum_score_threshold) VALUES ($1,$2,'Duplicate default',true,0.4,0.4,0.2,60)",
    [randomUUID(), fixture.organizationId], '23505',
  );
  await pool.query("INSERT INTO ai_configs (config_id,organization_id,name,is_default,skills_weight,experience_weight,education_weight,minimum_score_threshold) VALUES ($1,$2,'Other organization default',true,0.4,0.4,0.2,60)", [randomUUID(), ids.orgB]);
  checks.push({ check: 'one default per organization; two organizations may each have one', duplicateSqlState: '23505', passed: true });

  const own = await login(`${ids.adminA}@ats.test`, 'Runtime@123');
  const other = await login(`${ids.adminB}@ats.test`, 'Runtime@123');
  const candidateSession = await login('candidate-e2e@ats.test', 'Candidate@123');
  const ownSocket = await connectAndJoin(own);
  const otherSocket = await connectAndJoin(other);
  let outsideEvents = 0;
  otherSocket.on('application:application_created', () => { outsideEvents += 1; });
  const event = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Immediate authorized join lost its application event')), 5_000);
    ownSocket.once('application:application_created', data => { clearTimeout(timer); resolve(data); });
  });
  const applied = await call('POST', '/applications', candidateSession, { jobId: ids.job, cvId: ids.cv });
  assert.equal(applied.status, 201);
  applicationId = (await applied.json()).data.applicationId;
  assert.equal((await event).applicationId, applicationId);
  const logs = (await command('docker', ['compose', '-f', 'docker-compose.test.yml', 'logs', '--no-color', 'api'], { maxBuffer: 8 * 1024 * 1024 })).stdout;
  assert.ok(logs.includes(`Client ${ownSocket.id} joined room: job_${ids.job}`));
  assert.ok(logs.includes(`Client ${otherSocket.id} attempted to join unauthorized job room: job_${ids.job}`));
  assert.equal(outsideEvents, 0);
  checks.push({ check: 'immediate socket join receives real application event; other organization denied', passed: true });

  const allowed = await call('GET', `/applications/job/${ids.job}`, own);
  const forbidden = await call('GET', `/applications/job/${ids.job}`, other);
  assert.equal(allowed.status, 200);
  assert.equal(forbidden.status, 403);
  checks.push({ check: 'HTTP application list same organization 200; other organization 403', passed: true });
  const withdrawn = await call('POST', `/applications/${applicationId}/withdraw`, candidateSession);
  assert.equal(withdrawn.status, 201);
  const screening = await call('POST', `/applications/${applicationId}/trigger-screening`, own, {});
  assert.equal(screening.status, 400);
  assert.match((await screening.json()).message, /cancelled/);
  assert.equal(Number((await pool.query('SELECT count(*) AS count FROM cv_screenings WHERE application_id=$1', [applicationId])).rows[0].count), 0);
  checks.push({ check: 'withdrawn application rejects screening with 400 and creates no screening record', passed: true });
  success = true;
} finally {
  for (const socket of sockets) socket.disconnect();
  for (const session of sessions) {
    const response = await fetch(api + '/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${session.token}`, Cookie: session.cookie ?? '' } });
    assert.equal(response.status, 201);
  }
  await pool.query('DELETE FROM notifications WHERE related_entity_id IN (SELECT application_id FROM applications WHERE job_id=$1)', [ids.job]);
  await pool.query('DELETE FROM applications WHERE job_id=$1', [ids.job]);
  await pool.query('DELETE FROM cvs WHERE cv_id=$1', [ids.cv]);
  await pool.query('DELETE FROM job_postings WHERE job_id=$1', [ids.job]);
  await pool.query('DELETE FROM recruiters WHERE recruiter_id=$1', [ids.recruiter]);
  await pool.query('DELETE FROM users WHERE user_id=ANY($1::text[])', [[ids.adminA, ids.adminB, ids.recruiterUser]]);
  await pool.query('DELETE FROM departments WHERE department_id=$1', [ids.department]);
  await pool.query('DELETE FROM ai_configs WHERE organization_id=$1', [ids.orgB]);
  await pool.query('DELETE FROM organizations WHERE organization_id=$1', [ids.orgB]);
  assert.equal(Number((await pool.query('SELECT count(*) AS count FROM job_postings WHERE job_id=$1', [ids.job])).rows[0].count), 0);
  await pool.end();
  await writeFile('docs/tasks/test-defect-fixes/results/runtime-probes.json', JSON.stringify({ success, checks, cleanedUp: true }, null, 2) + '\n');
  console.log(JSON.stringify({ success, checks, cleanedUp: true }, null, 2));
}
