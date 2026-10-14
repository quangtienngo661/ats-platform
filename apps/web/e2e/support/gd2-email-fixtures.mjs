// Real PostgreSQL fixtures for the email journey on docker-compose.test.yml. Never the dev DB.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { withDatabase } from './gd1-fixtures.mjs';

/** One organization, a recruiter and a candidate ready to apply to an active job. No application is seeded. */
export async function createGd2EmailFixtures(apiUrl) {
  const api = new URL(apiUrl);
  assert.ok(['localhost', '127.0.0.1'].includes(api.hostname));
  assert.equal(api.port, '55000', 'Use the compose test API, never port 5000');
  const health = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(5_000) });
  assert.equal(health.status, 200);
  assert.equal((await health.json()).data.status, 'up');

  const runId = randomUUID();
  const suffix = runId.slice(0, 8);
  const fixture = {
    runId,
    password: 'Gd2Test@123',
    org: { id: randomUUID(), name: `GĐ2 email tổ chức ${suffix}`, slug: `gd2-email-${runId}` },
    department: { id: randomUUID() },
    recruiter: {
      userId: randomUUID(),
      recruiterId: randomUUID(),
      email: `gd2-email-recruiter-${runId}@ats.test`,
      name: `Recruiter email GĐ2 ${suffix}`,
    },
    candidate: { userId: randomUUID(), candidateId: randomUUID(), cvId: randomUUID(), email: `gd2-email-candidate-${runId}@ats.test` },
    job: { id: randomUUID(), title: `GĐ2 email <b>${suffix}</b> & co` },
  };

  await withDatabase(async (client) => {
    await client.query('BEGIN');
    try {
      await client.query('INSERT INTO organizations (organization_id,name,slug) VALUES ($1,$2,$3)', [
        fixture.org.id, fixture.org.name, fixture.org.slug,
      ]);
      await client.query('INSERT INTO departments (department_id,organization_id,name,color) VALUES ($1,$2,$3,$4)', [
        fixture.department.id, fixture.org.id, `GĐ2 email phòng ${suffix}`, '#0071E3',
      ]);
      const passwordHash = await bcrypt.hash(fixture.password, 10);
      await client.query(
        `INSERT INTO users (user_id,email,password_hash,full_name,role,email_verified)
         VALUES ($1,$2,$3,$4,'recruiter',true)`,
        [fixture.recruiter.userId, fixture.recruiter.email, passwordHash, fixture.recruiter.name],
      );
      await client.query(
        'INSERT INTO recruiters (recruiter_id,user_id,organization_id,department_id,position) VALUES ($1,$2,$3,$4,$5)',
        [fixture.recruiter.recruiterId, fixture.recruiter.userId, fixture.org.id, fixture.department.id, 'Interviewer GĐ2'],
      );
      await client.query(
        `INSERT INTO users (user_id,email,password_hash,full_name,role,email_verified)
         VALUES ($1,$2,$3,$4,'candidate',true)`,
        [fixture.candidate.userId, fixture.candidate.email, passwordHash, `Ứng viên email GĐ2 ${suffix}`],
      );
      await client.query('INSERT INTO candidates (candidate_id,user_id) VALUES ($1,$2)', [
        fixture.candidate.candidateId, fixture.candidate.userId,
      ]);
      await client.query(
        `INSERT INTO cvs (cv_id,candidate_id,file_name,file_path,parsing_status) VALUES ($1,$2,$3,$4,'completed')`,
        [fixture.candidate.cvId, fixture.candidate.candidateId, `gd2-email-${runId}.pdf`, `test-fixtures/gd2-email-${runId}.pdf`],
      );
      await client.query('INSERT INTO cv_parsed_data (id,cv_id,is_confirmed) VALUES ($1,$2,true)', [
        randomUUID(), fixture.candidate.cvId,
      ]);
      await client.query(
        `INSERT INTO job_postings (job_id,organization_id,department_id,created_by,title,location_type,status)
         VALUES ($1,$2,$3,$4,$5,'onsite','active')`,
        [fixture.job.id, fixture.org.id, fixture.department.id, fixture.recruiter.recruiterId, fixture.job.title],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
  return fixture;
}

export async function emailRowsOf(applicationId) {
  return withDatabase(async (client) => (await client.query(
    'SELECT type,status FROM email_notifications WHERE application_id=$1 ORDER BY created_at',
    [applicationId],
  )).rows);
}

export async function cleanupGd2EmailFixtures(fixture) {
  return withDatabase(async (client) => {
    const owned = (await client.query('SELECT slug FROM organizations WHERE organization_id=$1', [fixture.org.id])).rows;
    assert.equal(owned.length, 1);
    assert.equal(owned[0].slug, fixture.org.slug);
    await client.query('BEGIN');
    try {
      for (const table of [
        'email_notifications', 'interview_schedules', 'cv_screenings', 'application_history',
        'applications', 'job_posting_skills', 'job_postings',
        'recruiters', 'departments', 'ai_configs',
      ]) {
        await client.query(`DELETE FROM ${table} WHERE organization_id=$1`, [fixture.org.id]);
      }
      // Users cascade to their candidate, CV, parsed data, notifications and sessions.
      await client.query('DELETE FROM users WHERE email=ANY($1::text[])', [[fixture.recruiter.email, fixture.candidate.email]]);
      await client.query('DELETE FROM organizations WHERE organization_id=$1', [fixture.org.id]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    return {
      organizationsRemaining: Number((await client.query('SELECT count(*) AS count FROM organizations WHERE organization_id=$1', [fixture.org.id])).rows[0].count),
      usersRemaining: Number((await client.query('SELECT count(*) AS count FROM users WHERE email LIKE $1', [`%${fixture.runId}@ats.test`])).rows[0].count),
    };
  });
}
