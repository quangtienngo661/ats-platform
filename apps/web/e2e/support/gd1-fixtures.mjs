// Real PostgreSQL fixtures for docker-compose.test.yml. Never use the dev DB.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import pg from 'pg';
import bcrypt from 'bcrypt';
import Redis from 'ioredis';

const connectionString =
  'postgresql://ats_test:ats-local-test@localhost:55432/ats_test';

export async function waitForAuthWindow() {
  const redis = new Redis({ host: 'localhost', port: 56379, maxRetriesPerRequest: 1 });
  try {
    let cursor = '0';
    const keys = [];
    do {
      const page = await redis.scan(cursor, 'MATCH', 'throttle:*', 'COUNT', 100);
      cursor = page[0];
      keys.push(...page[1]);
    } while (cursor !== '0');
    const remaining = Math.max(0, ...await Promise.all(keys.map((key) => redis.pttl(key))));
    if (remaining > 0) {
      console.log(`GĐ1: waiting ${Math.ceil(remaining / 1000)}s for the real local auth window.`);
      await new Promise((resolve) => setTimeout(resolve, remaining + 100));
    }
  } finally {
    await redis.quit();
  }
}

async function withDatabase(operation) {
  const pool = new pg.Pool({ connectionString });
  const client = await pool.connect();
  try {
    assert.equal(
      (await client.query('SELECT current_database() AS name')).rows[0].name,
      'ats_test',
      'GĐ1 fixtures are restricted to the dedicated test database',
    );
    return await operation(client);
  } finally {
    client.release();
    await pool.end();
  }
}

export async function createGd1Fixtures(apiUrl) {
  const api = new URL(apiUrl);
  assert.ok(['localhost', '127.0.0.1'].includes(api.hostname));
  assert.equal(api.port, '55000', 'Use the compose test API, never port 5000');
  const health = await fetch(`${apiUrl}/health`, {
    signal: AbortSignal.timeout(5_000),
  });
  assert.equal(health.status, 200);
  assert.equal((await health.json()).data.status, 'up');

  const runId = randomUUID();
  const suffix = runId.slice(0, 8);
  const fixture = {
    runId,
    password: 'Gd1Test@123',
    orgA: { id: randomUUID(), name: `GĐ1 tổ chức A ${suffix}`, slug: `gd1-a-${runId}` },
    orgB: { id: randomUUID(), name: `GĐ1 tổ chức B ${suffix}`, slug: `gd1-b-${runId}` },
    departmentA: { id: randomUUID(), name: `GĐ1 phòng A ${suffix}` },
    departmentB: { id: randomUUID(), name: `GĐ1 phòng B ${suffix}` },
    adminA: { email: `gd1-admin-a-${runId}@ats.test`, name: `Quản trị A ${suffix}` },
    adminB: { id: randomUUID(), email: `gd1-admin-b-${runId}@ats.test`, name: `Quản trị B ${suffix}` },
    recruiterA: { email: `gd1-recruiter-a-${runId}@ats.test`, name: `Recruiter A ${suffix}` },
    recruiterB: { id: randomUUID(), userId: randomUUID(), email: `gd1-recruiter-b-${runId}@ats.test`, name: `Recruiter B ${suffix}` },
    rejectedEmail: `gd1-rejected-${runId}@ats.test`,
    candidate: { id: randomUUID(), userId: randomUUID(), email: `gd1-candidate-${runId}@ats.test`, name: `Ứng viên GĐ1 ${suffix}`, cvId: randomUUID() },
    aiA: { id: randomUUID(), name: `GĐ1 mặc định A ${suffix}`, replacementId: randomUUID(), replacementName: `GĐ1 thay thế A ${suffix}` },
    aiB: { id: randomUUID(), name: `GĐ1 mặc định B ${suffix}` },
    jobA: { title: `GĐ1 tin A ${suffix}` },
    jobB: { id: randomUUID(), title: `GĐ1 tin B ${suffix}` },
    applicationBId: randomUUID(),
    interviewBId: randomUUID(),
  };
  await withDatabase(async (client) => {
    await client.query('BEGIN');
    try {
      for (const org of [fixture.orgA, fixture.orgB]) {
        await client.query(
          'INSERT INTO organizations (organization_id,name,slug) VALUES ($1,$2,$3)',
          [org.id, org.name, org.slug],
        );
      }
      for (const [department, org] of [
        [fixture.departmentA, fixture.orgA],
        [fixture.departmentB, fixture.orgB],
      ]) {
        await client.query(
          'INSERT INTO departments (department_id,organization_id,name,color) VALUES ($1,$2,$3,$4)',
          [department.id, org.id, department.name, '#0071E3'],
        );
      }
      const passwordHash = await bcrypt.hash(fixture.password, 10);
      for (const [userId, email, name, role, organizationId] of [
        [fixture.adminB.id, fixture.adminB.email, fixture.adminB.name, 'org_admin', fixture.orgB.id],
        [fixture.recruiterB.userId, fixture.recruiterB.email, fixture.recruiterB.name, 'recruiter', null],
        [fixture.candidate.userId, fixture.candidate.email, fixture.candidate.name, 'candidate', null],
      ]) {
        await client.query(
          `INSERT INTO users (user_id,email,password_hash,full_name,role,email_verified,organization_id)
           VALUES ($1,$2,$3,$4,$5,true,$6)`,
          [userId, email, passwordHash, name, role, organizationId],
        );
      }
      await client.query(
        'INSERT INTO recruiters (recruiter_id,user_id,organization_id,department_id,position) VALUES ($1,$2,$3,$4,$5)',
        [fixture.recruiterB.id, fixture.recruiterB.userId, fixture.orgB.id, fixture.departmentB.id, 'Interviewer B'],
      );
      await client.query('INSERT INTO candidates (candidate_id,user_id) VALUES ($1,$2)', [fixture.candidate.id, fixture.candidate.userId]);
      await client.query(
        `INSERT INTO cvs (cv_id,candidate_id,file_name,file_path,parsing_status)
         VALUES ($1,$2,$3,$4,'completed')`,
        [fixture.candidate.cvId, fixture.candidate.id, `gd1-${runId}.pdf`, `test-fixtures/${runId}.pdf`],
      );
      for (const [id, orgId, name, isDefault] of [
        [fixture.aiA.id, fixture.orgA.id, fixture.aiA.name, true],
        [fixture.aiA.replacementId, fixture.orgA.id, fixture.aiA.replacementName, false],
        [fixture.aiB.id, fixture.orgB.id, fixture.aiB.name, true],
      ]) {
        await client.query(
          `INSERT INTO ai_configs (config_id,organization_id,name,is_default,skills_weight,experience_weight,education_weight,minimum_score_threshold)
           VALUES ($1,$2,$3,$4,0.4,0.4,0.2,60)`,
          [id, orgId, name, isDefault],
        );
      }
      await client.query(
        `INSERT INTO job_postings (job_id,organization_id,department_id,created_by,title,location_type,status)
         VALUES ($1,$2,$3,$4,$5,'onsite','draft')`,
        [fixture.jobB.id, fixture.orgB.id, fixture.departmentB.id, fixture.recruiterB.id, fixture.jobB.title],
      );
      await client.query(
        `INSERT INTO applications (application_id,organization_id,job_id,candidate_id,cv_id,status)
         VALUES ($1,$2,$3,$4,$5,'interview')`,
        [fixture.applicationBId, fixture.orgB.id, fixture.jobB.id, fixture.candidate.id, fixture.candidate.cvId],
      );
      await client.query(
        `INSERT INTO interview_schedules (interview_id,organization_id,application_id,scheduled_by,interviewer_id,interview_type,start_at)
         VALUES ($1,$2,$3,$4,$5,'onsite',$6)`,
        [fixture.interviewBId, fixture.orgB.id, fixture.applicationBId, fixture.adminB.id, fixture.recruiterB.userId, new Date(Date.now() + 86_400_000)],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
  await mkdir('docs/tasks/gd1-week3/results', { recursive: true });
  await writeFile(
    'docs/tasks/gd1-week3/results/e2e-fixture.json',
    JSON.stringify({ runId, database: 'ats_test', organizationIds: [fixture.orgA.id, fixture.orgB.id], ownership: 'Unique per run; removed in afterAll; no real uploads or external AI.' }, null, 2) + '\n',
  );
  return fixture;
}

export async function attachInterviewApplication(fixture, jobId) {
  return withDatabase(async (client) => {
    const job = (await client.query('SELECT organization_id FROM job_postings WHERE job_id=$1', [jobId])).rows[0];
    assert.equal(job?.organization_id, fixture.orgA.id);
    const applicationId = randomUUID();
    await client.query(
      `INSERT INTO applications (application_id,organization_id,job_id,candidate_id,cv_id,status)
       VALUES ($1,$2,$3,$4,$5,'interview')`,
      [applicationId, fixture.orgA.id, jobId, fixture.candidate.id, fixture.candidate.cvId],
    );
    return applicationId;
  });
}

export async function recruiterAccountEvidence(email, password) {
  return withDatabase(async (client) => {
    const row = (await client.query(
      `SELECT u.user_id,u.role,u.organization_id,u.password_hash,r.recruiter_id,
              r.organization_id AS recruiter_organization_id,r.department_id
       FROM users u LEFT JOIN recruiters r ON r.user_id=u.user_id WHERE u.email=$1`,
      [email],
    )).rows[0];
    if (!row) return null;
    const { password_hash, ...safe } = row;
    return { ...safe, passwordMatches: await bcrypt.compare(password, password_hash), passwordStoredPlaintext: password_hash === password };
  });
}

export async function userCountByEmail(email) {
  return withDatabase(async (client) => Number((await client.query('SELECT count(*) AS count FROM users WHERE email=$1', [email])).rows[0].count));
}

export async function cleanupGd1Fixtures(fixture) {
  return withDatabase(async (client) => {
    const orgIds = [fixture.orgA.id, fixture.orgB.id];
    // Verify exact owned IDs/slugs before deleting any rows.
    const owned = (await client.query(
      'SELECT organization_id,slug FROM organizations WHERE organization_id IN ($1,$2)', orgIds,
    )).rows;
    assert.equal(owned.length, 2);
    for (const row of owned) {
      assert.ok([fixture.orgA.slug, fixture.orgB.slug].includes(row.slug));
    }
    await client.query('BEGIN');
    try {
      for (const table of [
        'interview_schedules', 'cv_screenings', 'application_history',
        'applications', 'job_posting_skills', 'job_postings',
        'recruiters', 'departments', 'ai_configs',
      ]) {
        await client.query(`DELETE FROM ${table} WHERE organization_id IN ($1,$2)`, orgIds);
      }
      const emails = [fixture.adminA.email, fixture.adminB.email, fixture.recruiterA.email, fixture.recruiterB.email, fixture.candidate.email, fixture.rejectedEmail];
      await client.query('DELETE FROM users WHERE email=ANY($1::text[])', [emails]);
      await client.query('DELETE FROM organizations WHERE organization_id IN ($1,$2)', orgIds);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    return {
      organizationsRemaining: Number((await client.query('SELECT count(*) AS count FROM organizations WHERE organization_id IN ($1,$2)', orgIds)).rows[0].count),
      usersRemaining: Number((await client.query('SELECT count(*) AS count FROM users WHERE email LIKE $1', [`%${fixture.runId}@ats.test`])).rows[0].count),
    };
  });
}
