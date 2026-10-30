// Real PostgreSQL fixtures for the screening-review journey on docker-compose.test.yml. Never the dev DB.
// Two applications of one job, each with a completed, UNREVIEWED screening: A is reviewed by the journey,
// B is the control that must stay unreviewed.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { withDatabase } from './gd1-fixtures.mjs';

export async function createGd3ReviewFixtures(apiUrl) {
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
    password: 'Gd3Test@123',
    org: { id: randomUUID(), name: `GĐ3 review organization ${suffix}`, slug: `gd3-review-${runId}` },
    department: { id: randomUUID() },
    recruiter: {
      userId: randomUUID(),
      recruiterId: randomUUID(),
      email: `gd3-review-recruiter-${runId}@ats.test`,
      name: `Review recruiter ${suffix}`,
      phone: `0987${phoneSuffix}`,
    },
    config: { id: randomUUID() },
    job: { id: randomUUID(), title: `GĐ3 review job ${suffix}` },
    // AI scores 80/70/60 at weights 0.5/0.3/0.2 → overall 73.
    candidateA: { name: `Review candidate A ${suffix}`, email: `gd3-review-candidate-a-${runId}@ats.test`, applicationId: randomUUID() },
    candidateB: { name: `Review candidate B ${suffix}`, email: `gd3-review-candidate-b-${runId}@ats.test`, applicationId: randomUUID() },
    aiScores: { skills: 80, experience: 70, education: 60, overall: 73 },
  };
  const passwordHash = await bcrypt.hash(fixture.password, 10);
  const baseTime = Date.now() - 7 * 86_400_000;

  await withDatabase(async (client) => {
    await client.query('BEGIN');
    try {
      await client.query('INSERT INTO organizations (organization_id,name,slug) VALUES ($1,$2,$3)', [
        fixture.org.id, fixture.org.name, fixture.org.slug,
      ]);
      await client.query('INSERT INTO departments (department_id,organization_id,name,color) VALUES ($1,$2,$3,$4)', [
        fixture.department.id, fixture.org.id, `GĐ3 review department ${suffix}`, '#0071E3',
      ]);
      await client.query(
        `INSERT INTO users (user_id,email,password_hash,full_name,role,email_verified,phone_number)
         VALUES ($1,$2,$3,$4,'recruiter',true,$5)`,
        [fixture.recruiter.userId, fixture.recruiter.email, passwordHash, fixture.recruiter.name, fixture.recruiter.phone],
      );
      await client.query(
        'INSERT INTO recruiters (recruiter_id,user_id,organization_id,department_id,position) VALUES ($1,$2,$3,$4,$5)',
        [fixture.recruiter.recruiterId, fixture.recruiter.userId, fixture.org.id, fixture.department.id, 'Recruiter'],
      );
      await client.query(
        `INSERT INTO ai_configs (config_id,organization_id,name,is_default,skills_weight,experience_weight,education_weight,minimum_score_threshold)
         VALUES ($1,$2,$3,true,0.5,0.3,0.2,60)`,
        [fixture.config.id, fixture.org.id, `GĐ3 review default ${suffix}`],
      );
      await client.query(
        `INSERT INTO job_postings (job_id,organization_id,department_id,created_by,title,location_type,status)
         VALUES ($1,$2,$3,$4,$5,'onsite','active')`,
        [fixture.job.id, fixture.org.id, fixture.department.id, fixture.recruiter.recruiterId, fixture.job.title],
      );
      for (const [index, candidate] of [fixture.candidateA, fixture.candidateB].entries()) {
        const userId = randomUUID();
        const candidateId = randomUUID();
        const cvId = randomUUID();
        await client.query(
          `INSERT INTO users (user_id,email,password_hash,full_name,role,email_verified)
           VALUES ($1,$2,$3,$4,'candidate',true)`,
          [userId, candidate.email, passwordHash, candidate.name],
        );
        await client.query('INSERT INTO candidates (candidate_id,user_id) VALUES ($1,$2)', [candidateId, userId]);
        await client.query(
          `INSERT INTO cvs (cv_id,candidate_id,file_name,file_path,parsing_status)
           VALUES ($1,$2,$3,$4,'completed')`,
          [cvId, candidateId, `gd3-review-${index + 1}-${runId}.pdf`, `test-fixtures/gd3-review-${runId}/${index + 1}.pdf`],
        );
        await client.query(
          `INSERT INTO applications (application_id,organization_id,job_id,candidate_id,cv_id,status,applied_at)
           VALUES ($1,$2,$3,$4,$5,'screening',$6)`,
          [candidate.applicationId, fixture.org.id, fixture.job.id, candidateId, cvId, new Date(baseTime + index * 60_000)],
        );
        await client.query(
          `INSERT INTO cv_screenings (screening_id,organization_id,application_id,cv_id,config_id,status,
                                      overall_score,skills_score,experience_score,education_score,
                                      ai_recommendation,ai_reasoning,matched_skills,missing_skills,screened_at)
           VALUES ($1,$2,$3,$4,$5,'completed',73,80,70,60,'interview','Hồ sơ phù hợp',$6::jsonb,$7::jsonb,$8)`,
          [randomUUID(), fixture.org.id, candidate.applicationId, cvId, fixture.config.id,
            JSON.stringify({ hardSkills: ['NestJS', 'SQL'] }), JSON.stringify(['Docker']), new Date(baseTime + 120 * 60_000)],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
  return fixture;
}

/** The persisted review of one application, read straight from PostgreSQL. */
export async function readScreening(applicationId) {
  return withDatabase(async (client) => (await client.query(
    `SELECT status, overall_score, skills_score, experience_score, education_score, ai_recommendation,
            reviewed_by_id, reviewed_at, reviewed_skills_score, reviewed_experience_score,
            reviewed_education_score, reviewed_overall_score, review_note
       FROM cv_screenings WHERE application_id=$1`,
    [applicationId],
  )).rows[0]);
}

export async function readApplicationStatus(applicationId) {
  return withDatabase(async (client) => (await client.query(
    'SELECT status FROM applications WHERE application_id=$1', [applicationId],
  )).rows[0].status);
}

export async function cleanupGd3ReviewFixtures(fixture) {
  assert.equal(fixture.org.slug, `gd3-review-${fixture.runId}`);
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
