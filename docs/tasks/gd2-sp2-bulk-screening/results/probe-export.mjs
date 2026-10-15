// Run from the repository root while the reviewing session owns the test-stack lock.
import assert from 'node:assert/strict';
import { appendFileSync, writeFileSync } from 'node:fs';
import {
  createGd2BulkFixtures,
  cleanupGd2BulkFixtures,
} from '../../../../apps/web/e2e/support/gd2-bulk-fixtures.mjs';
import { waitForAuthWindow } from '../../../../apps/web/e2e/support/gd1-fixtures.mjs';

const apiUrl = 'http://localhost:55000/api';
const logPath = new URL('./probe-export.log', import.meta.url);
// Keep this copy aligned with application-export.service.ts without importing API code.
const EXPORT_HEADERS = [
  'Mã đơn',
  'Họ tên',
  'Trạng thái',
  'Ngày nộp',
  'Chức danh hiện tại',
  'Số năm kinh nghiệm',
  'Trạng thái sàng lọc',
  'Điểm tổng (gợi ý AI)',
  'Điểm kỹ năng',
  'Điểm kinh nghiệm',
  'Điểm học vấn',
  'Gợi ý AI',
  'Kỹ năng khớp',
  'Kỹ năng thiếu',
];
const expectedHeader = EXPORT_HEADERS.map((header) => `"${header}"`).join(',');
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

async function login(recruiter) {
  const credentials = { email: recruiter.email, password: fixture.password };
  async function requestLogin() {
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      signal: AbortSignal.timeout(30_000),
    });
    const body = await response.json();
    return { status: response.status, token: body?.data?.accessToken };
  }

  let result = await requestLogin();
  if (result.status === 429) {
    // Capture the shared helper's wait message in both probe outputs.
    const originalLog = console.log;
    console.log = (...messages) => log(`PASS auth-window ${JSON.stringify({ message: messages.join(' ') })}`);
    try {
      await waitForAuthWindow();
    } finally {
      console.log = originalLog;
    }
    result = await requestLogin();
  }
  const passed = check('login-recruiter-1', {
    status: result.status,
    hasAccessToken: typeof result.token === 'string' && result.token.length > 0,
  }, () => {
    assert.equal(result.status, 201);
    assert.equal(typeof result.token, 'string');
    assert.ok(result.token.length > 0);
  });
  if (!passed) throw new Error('Recruiter login failed; export cannot run without authentication');
  return result.token;
}

try {
  fixture = await createGd2BulkFixtures(apiUrl);
  log(`organization_id=${fixture.org.id}`);
  const token = await login(fixture.recruiter1);
  const response = await fetch(`${apiUrl}/applications/job/${fixture.jobA.id}/export`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30_000),
  });
  // Read bytes first: text decoders may strip the BOM that P6 must verify.
  const body = Buffer.from(await response.arrayBuffer());
  const text = body.toString('utf8').replace(/^\uFEFF/, '');
  const records = text.split('\r\n');
  const dataRecords = records.slice(1).filter((record) => record.length > 0);
  const privateEmails = [
    ...fixture.candidateEmails,
    fixture.recruiter1.email,
    fixture.recruiter2.email,
  ];
  const observed = {
    status: response.status,
    contentType: response.headers.get('content-type'),
    contentDisposition: response.headers.get('content-disposition'),
    bomBytes: Array.from(body.subarray(0, 3)),
    headerMatches: records[0] === expectedHeader,
    hasJsonEnvelope: text.startsWith('{"success"'),
    emailLeakCount: privateEmails.filter((email) => text.includes(email)).length,
    cancelledApplicationPresent: text.includes(fixture.jobA.cancelledId),
    dataRecords: dataRecords.length,
    bodySizeBytes: body.length, // A2: actual fixture export size, including the BOM.
  };
  check('P6', observed, () => {
    assert.equal(observed.status, 200);
    assert.equal(observed.contentType, 'text/csv; charset=utf-8');
    assert.ok(observed.contentDisposition?.startsWith('attachment; filename="ung-vien-'));
    assert.deepEqual(observed.bomBytes, [0xEF, 0xBB, 0xBF]);
    assert.equal(records[0], expectedHeader);
    assert.equal(observed.hasJsonEnvelope, false);
    assert.equal(observed.emailLeakCount, 0);
    assert.equal(observed.cancelledApplicationPresent, false);
    assert.equal(observed.dataRecords, 62);
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
