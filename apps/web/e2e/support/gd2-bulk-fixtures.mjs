// Real PostgreSQL fixtures for bulk screening on docker-compose.test.yml. Never the dev DB.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { withDatabase } from './gd1-fixtures.mjs';

export async function createGd2BulkFixtures(apiUrl) {
  const api = new URL(apiUrl);
  assert.ok(['localhost', '127.0.0.1'].includes(api.hostname));
  assert.equal(api.port, '55000', 'Use the compose test API, never port 5000');
  const health = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(5_000) });
  assert.equal(health.status, 200);
  assert.equal((await health.json()).data.status, 'up');

  const runId = randomUUID();
  const suffix = runId.slice(0, 8);
  const phoneSuffix = String(Number.parseInt(suffix, 16) % 1_000_000).padStart(6, '0');
  const fixture = {
    runId,
    password: 'Gd2Test@123',
    org: { id: randomUUID(), name: `GĐ2 bulk organization ${suffix}`, slug: `gd2-bulk-${runId}` },
    department: { id: randomUUID() },
    recruiter1: {
      userId: randomUUID(),
      recruiterId: randomUUID(),
      email: `gd2-bulk-recruiter-1-${runId}@ats.test`,
      phone: `0987${phoneSuffix}`,
    },
    recruiter2: {
      userId: randomUUID(),
      recruiterId: randomUUID(),
      email: `gd2-bulk-recruiter-2-${runId}@ats.test`,
      phone: `0988${phoneSuffix}`,
    },
    config: { id: randomUUID() },
    jobA: {
      id: randomUUID(),
      screeningIds: Array.from({ length: 60 }, () => randomUUID()),
      appliedId: randomUUID(),
      interviewId: randomUUID(),
      cancelledId: randomUUID(),
    },
    jobB: { id: randomUUID(), appliedId: randomUUID(), completedId: randomUUID() },
    candidateEmails: [],
  };

  // [applicationId, jobId, status, minutes from the base time, completed screening]
  const applications = [
    ...fixture.jobA.screeningIds.map((id, index) => [id, fixture.jobA.id, 'screening', index, false]),
    [fixture.jobA.appliedId, fixture.jobA.id, 'applied', -3, false],
    [fixture.jobA.interviewId, fixture.jobA.id, 'interview', -2, true],
    [fixture.jobA.cancelledId, fixture.jobA.id, 'cancelled', -1, false],
    [fixture.jobB.appliedId, fixture.jobB.id, 'applied', 0, false],
    [fixture.jobB.completedId, fixture.jobB.id, 'screening', 1, true],
  ];
  fixture.candidateEmails = applications.map((_, index) => `gd2-bulk-candidate-${index + 1}-${runId}@ats.test`);
  const baseTime = Date.now() - 30 * 86_400_000;
  const passwordHash = await bcrypt.hash(fixture.password, 10);

  await withDatabase(async (client) => {
    await client.query('BEGIN');
    try {
      await client.query('INSERT INTO organizations (organization_id,name,slug) VALUES ($1,$2,$3)', [
        fixture.org.id, fixture.org.name, fixture.org.slug,
      ]);
      await client.query('INSERT INTO departments (department_id,organization_id,name,color) VALUES ($1,$2,$3,$4)', [
        fixture.department.id, fixture.org.id, `GĐ2 bulk department ${suffix}`, '#0071E3',
      ]);
      for (const [index, recruiter] of [fixture.recruiter1, fixture.recruiter2].entries()) {
        await client.query(
          `INSERT INTO users (user_id,email,password_hash,full_name,role,email_verified,phone_number)
           VALUES ($1,$2,$3,$4,'recruiter',true,$5)`,
          [recruiter.userId, recruiter.email, passwordHash, `Bulk recruiter ${index + 1} ${suffix}`, recruiter.phone],
        );
        await client.query(
          'INSERT INTO recruiters (recruiter_id,user_id,organization_id,department_id,position) VALUES ($1,$2,$3,$4,$5)',
          [recruiter.recruiterId, recruiter.userId, fixture.org.id, fixture.department.id, 'Recruiter'],
        );
      }
      await client.query(
        `INSERT INTO ai_configs (config_id,organization_id,name,is_default,skills_weight,experience_weight,education_weight,minimum_score_threshold)
         VALUES ($1,$2,$3,true,0.5,0.3,0.2,60)`,
        [fixture.config.id, fixture.org.id, `GĐ2 bulk default ${suffix}`],
      );
      for (const [name, job] of [['A', fixture.jobA], ['B', fixture.jobB]]) {
        await client.query(
          `INSERT INTO job_postings (job_id,organization_id,department_id,created_by,title,location_type,status)
           VALUES ($1,$2,$3,$4,$5,'onsite','active')`,
          [job.id, fixture.org.id, fixture.department.id, fixture.recruiter1.recruiterId, `GĐ2 bulk job ${name} ${suffix}`],
        );
      }
      for (const [index, [applicationId, jobId, status, minuteOffset, completed]] of applications.entries()) {
        const userId = randomUUID();
        const candidateId = randomUUID();
        const cvId = randomUUID();
        await client.query(
          `INSERT INTO users (user_id,email,password_hash,full_name,role,email_verified)
           VALUES ($1,$2,$3,$4,'candidate',true)`,
          [userId, fixture.candidateEmails[index], passwordHash, `Bulk candidate ${index + 1} ${suffix}`],
        );
        await client.query('INSERT INTO candidates (candidate_id,user_id) VALUES ($1,$2)', [candidateId, userId]);
        await client.query(
          `INSERT INTO cvs (cv_id,candidate_id,file_name,file_path,parsing_status)
           VALUES ($1,$2,$3,$4,'completed')`,
          [cvId, candidateId, `gd2-bulk-${index + 1}-${runId}.pdf`, `test-fixtures/gd2-bulk-${runId}/${index + 1}.pdf`],
        );
        await client.query(
          `INSERT INTO applications (application_id,organization_id,job_id,candidate_id,cv_id,status,applied_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [applicationId, fixture.org.id, jobId, candidateId, cvId, status, new Date(baseTime + minuteOffset * 60_000)],
        );
        if (completed) {
          await client.query(
            `INSERT INTO cv_screenings (screening_id,organization_id,application_id,cv_id,config_id,status,
                                        overall_score,skills_score,experience_score,education_score,
                                        ai_recommendation,matched_skills,missing_skills,screened_at)
             VALUES ($1,$2,$3,$4,$5,'completed',82.5,85,80,80,'interview',$6::jsonb,$7::jsonb,$8)`,
            [randomUUID(), fixture.org.id, applicationId, cvId, fixture.config.id,
              JSON.stringify({ hardSkills: ['NestJS', 'SQL'] }), JSON.stringify(['Docker']), new Date(baseTime + 120 * 60_000)],
          );
        }
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
  return fixture;
}

export async function cleanupGd2BulkFixtures(fixture) {
  assert.equal(fixture.org.slug, `gd2-bulk-${fixture.runId}`);
  return withDatabase(async (client) => {
    const owned = (await client.query('SELECT slug FROM organizations WHERE organization_id=$1', [fixture.org.id])).rows;
    assert.equal(owned.length, 1);
    assert.equal(owned[0].slug, fixture.org.slug);
    await client.query('BEGIN');
    try {
      for (const table of [
        'interview_schedules', 'cv_screenings', 'application_history',
        'applications', 'job_posting_skills', 'job_postings',
        'recruiters', 'departments', 'ai_configs',
      ]) {
        await client.query(`DELETE FROM ${table} WHERE organization_id=$1`, [fixture.org.id]);
      }
      // Users cascade to their candidate, CV, notifications and sessions.
      await client.query('DELETE FROM users WHERE email LIKE $1', [`%${fixture.runId}@ats.test`]);
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
