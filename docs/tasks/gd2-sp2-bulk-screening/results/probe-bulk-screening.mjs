// Run from the repository root while the reviewing session owns the test-stack lock.
import assert from 'node:assert/strict';
import { appendFileSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import {
  createGd2BulkFixtures,
  cleanupGd2BulkFixtures,
} from '../../../../apps/web/e2e/support/gd2-bulk-fixtures.mjs';
import { waitForAuthWindow, withDatabase } from '../../../../apps/web/e2e/support/gd1-fixtures.mjs';

const apiUrl = 'http://localhost:55000/api';
const logPath = new URL('./probe-bulk-screening.log', import.meta.url);
let fixture;
let failed = false;
writeFileSync(logPath, '', 'utf8');

function log(line) {
  appendFileSync(logPath, `${line}\n`, 'utf8');
  process.stdout.write(`${line}\n`);
}

function check(name, observed, verify) {
  try {
    verify();
  } catch (error) {
    failed = true;
    log(`FAIL ${name} ${JSON.stringify({ ...observed, error: error.message })}`);
    return false;
  }
  log(`PASS ${name} ${JSON.stringify(observed)}`);
  return true;
}

async function post(path, body, token) {
  const response = await fetch(`${apiUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: response.status, body: data };
}

async function login(name, recruiter) {
  const credentials = { email: recruiter.email, password: fixture.password };
  let result = await post('/auth/login', credentials);
  if (result.status === 429) {
    // Keep the shared helper's wait message in the probe log.
    const originalLog = console.log;
    console.log = (...messages) => log(`PASS auth-window ${JSON.stringify({ message: messages.join(' ') })}`);
    try {
      await waitForAuthWindow();
    } finally {
      console.log = originalLog;
    }
    result = await post('/auth/login', credentials);
  }
  const token = result.body?.data?.accessToken;
  const passed = check(name, {
    email: recruiter.email,
    status: result.status,
    hasAccessToken: typeof token === 'string' && token.length > 0,
  }, () => {
    assert.equal(result.status, 201);
    assert.equal(typeof token, 'string');
    assert.ok(token.length > 0);
  });
  if (!passed) throw new Error(`${name} failed; bulk checks cannot run without authentication`);
  return token;
}

function queuedIds(result) {
  const queued = result.body?.data?.queued;
  return Array.isArray(queued) ? queued.map((row) => row.applicationId) : null;
}

try {
  fixture = await createGd2BulkFixtures(apiUrl);
  log(`organization_id=${fixture.org.id}`);
  const token1 = await login('login-recruiter-1', fixture.recruiter1);
  const token2 = await login('login-recruiter-2', fixture.recruiter2);
  const bulkPath = `/applications/job/${fixture.jobA.id}/bulk-screening`;
  const remainingIds = fixture.jobA.screeningIds.slice(50);

  const windowStart = performance.now();
  let p3;
  try {
    p3 = await post(bulkPath, {}, token1);
  } catch (error) {
    failed = true;
    log(`FAIL P3 ${JSON.stringify({ wallTimeMs: Number((performance.now() - windowStart).toFixed(2)), error: error.message })}`);
    throw error;
  }
  const elapsedMs = performance.now() - windowStart;
  check('P3', { ...p3, wallTimeMs: Number(elapsedMs.toFixed(2)) }, () => {
    assert.equal(p3.status, 200);
    assert.equal(p3.body?.success, true);
    assert.deepEqual(queuedIds(p3), fixture.jobA.screeningIds.slice(0, 50));
    assert.equal(p3.body?.data?.remaining, 10);
    assert.deepEqual(p3.body?.data?.skipped, []);
    for (const id of [fixture.jobA.appliedId, fixture.jobA.interviewId, fixture.jobA.cancelledId]) {
      assert.ok(!queuedIds(p3).includes(id), `Excluded application was queued: ${id}`);
    }
    assert.ok(elapsedMs <= 15_000, `P3 took ${elapsedMs.toFixed(2)} ms; limit is 15000 ms`);
  });

  const selectedIds = remainingIds.slice(0, 3);
  const p1 = await post(bulkPath, { applicationIds: selectedIds }, token1);
  const screenings = await withDatabase(async (client) => (await client.query(
    'SELECT application_id,config_id FROM cv_screenings WHERE application_id=ANY($1::text[]) ORDER BY application_id',
    [selectedIds],
  )).rows);
  check('P1', { ...p1, screenings, expectedConfigId: fixture.config.id }, () => {
    assert.equal(p1.status, 200);
    assert.equal(p1.body?.success, true);
    assert.deepEqual(queuedIds(p1), selectedIds);
    assert.deepEqual(p1.body?.data?.skipped, []);
    assert.equal(screenings.length, 3);
    assert.deepEqual(screenings.map((row) => row.application_id).sort(), [...selectedIds].sort());
    assert.ok(screenings.every((row) => row.config_id === fixture.config.id));
  });

  const p2 = await post(bulkPath, {
    applicationIds: [fixture.jobA.appliedId],
    moveAppliedToScreening: true,
  }, token1);
  const transition = await withDatabase(async (client) => ({
    applications: (await client.query(
      'SELECT status FROM applications WHERE application_id=$1', [fixture.jobA.appliedId],
    )).rows,
    history: (await client.query(
      'SELECT from_status,to_status,changed_by FROM application_history WHERE application_id=$1 ORDER BY changed_at',
      [fixture.jobA.appliedId],
    )).rows,
  }));
  check('P2', { ...p2, ...transition, expectedChangedBy: fixture.recruiter1.userId }, () => {
    assert.equal(p2.status, 200);
    assert.equal(p2.body?.success, true);
    assert.deepEqual(p2.body?.data?.queued, [{
      applicationId: fixture.jobA.appliedId,
      movedToScreening: true,
    }]);
    assert.deepEqual(p2.body?.data?.skipped, []);
    assert.deepEqual(transition.applications, [{ status: 'screening' }]);
    assert.deepEqual(transition.history, [{
      from_status: 'applied',
      to_status: 'screening',
      changed_by: fixture.recruiter1.userId,
    }]);
  });

  const fourthRequestAtMs = performance.now() - windowStart;
  const p4 = await post(bulkPath, { applicationIds: [remainingIds[3]] }, token1);
  check('P4', { ...p4, fourthRequestAtMs: Number(fourthRequestAtMs.toFixed(2)) }, () => {
    assert.ok(fourthRequestAtMs < 60_000, 'The fourth request must start within the first throttle minute');
    assert.equal(p4.status, 429);
  });
  const p5 = await post(bulkPath, { applicationIds: [remainingIds[4]] }, token2);
  check('P5', { ...p5, recruiterUserId: fixture.recruiter2.userId }, () => {
    assert.equal(p5.status, 200);
    assert.equal(p5.body?.success, true);
    assert.deepEqual(p5.body?.data?.queued, [{ applicationId: remainingIds[4], movedToScreening: false }]);
    assert.deepEqual(p5.body?.data?.skipped, []);
  });
} catch (error) {
  failed = true;
  log(`FAIL exception ${JSON.stringify({ message: error.message, stack: error.stack })}`);
} finally {
  if (fixture) {
    try {
      const cleanup = await cleanupGd2BulkFixtures(fixture);
      check('cleanup', cleanup, () => {
        assert.equal(cleanup.organizationsRemaining, 0);
        assert.equal(cleanup.usersRemaining, 0);
      });
    } catch (error) {
      failed = true;
      log(`FAIL cleanup ${JSON.stringify({ organizationId: fixture.org.id, message: error.message, stack: error.stack })}`);
    }
  }
}
process.exitCode = failed ? 1 : 0;
