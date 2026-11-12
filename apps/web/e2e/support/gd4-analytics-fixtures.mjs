// Real PostgreSQL fixtures for the dashboard journey on docker-compose.test.yml. Never the dev DB.
// One organization, one department, one job, five applications applied in the last week that walked the
// funnel to different stages, with their history rows: so the funnel must read 5 / 4 / 3 / 2 / 1.
// Plus AI usage rows of the organization (one priced model, one unpriced) for the cost block.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { withDatabase } from './gd1-fixtures.mjs';

const PATHS = [
  ['applied'],
  ['applied', 'screening'],
  ['applied', 'screening', 'interview'],
  ['applied', 'screening', 'interview', 'offer'],
  ['applied', 'screening', 'interview', 'offer', 'hired'],
];

export async function createGd4AnalyticsFixtures(apiUrl) {
  const api = new URL(apiUrl);
  assert.ok(['localhost', '127.0.0.1'].includes(api.hostname));
  assert.equal(api.port, '55000', 'Use the compose test API, never port 5000');

  const runId = randomUUID();
  const suffix = runId.slice(0, 8);
  const phoneSuffix = String(Number.parseInt(suffix, 16) % 1_000_000).padStart(6, '0');
  const fixture = {
    runId,
    password: 'Gd4Test@123',
    org: { id: randomUUID(), name: `GĐ4 analytics organization ${suffix}`, slug: `gd4-analytics-${runId}` },
    department: { id: randomUUID() },
    recruiter: {
      userId: randomUUID(),
      recruiterId: randomUUID(),
      email: `gd4-analytics-recruiter-${runId}@ats.test`,
      name: `Thống kê recruiter ${suffix}`,
      phone: `0985${phoneSuffix}`,
    },
    orgAdmin: { userId: randomUUID(), email: `gd4-analytics-orgadmin-${runId}@ats.test`, name: `Quản trị tổ chức ${suffix}` },
    job: { id: randomUUID(), title: `GĐ4 analytics job ${suffix}` },
    candidates: PATHS.map((path, i) => ({ name: `Ứng viên thống kê ${i + 1} ${suffix}`, applicationId: randomUUID(), path })),
    pricedModel: `gd4-priced-${suffix}`,
    unpricedModel: `gd4-unpriced-${suffix}`,
  };
  const passwordHash = await bcrypt.hash(fixture.password, 10);
  const DAY = 86_400_000;
  const start = Date.now() - 6 * DAY;

  await withDatabase(async (client) => {
    await client.query('BEGIN');
    try {
      await client.query('INSERT INTO organizations (organization_id,name,slug) VALUES ($1,$2,$3)', [
        fixture.org.id, fixture.org.name, fixture.org.slug,
      ]);
      await client.query('INSERT INTO departments (department_id,organization_id,name,color) VALUES ($1,$2,$3,$4)', [
        fixture.department.id, fixture.org.id, `GĐ4 analytics department ${suffix}`, '#0071E3',
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
        `INSERT INTO users (user_id,email,password_hash,full_name,role,email_verified,organization_id)
         VALUES ($1,$2,$3,$4,'org_admin',true,$5)`,
        [fixture.orgAdmin.userId, fixture.orgAdmin.email, passwordHash, fixture.orgAdmin.name, fixture.org.id],
      );
      await client.query(
        `INSERT INTO job_postings (job_id,organization_id,department_id,created_by,title,location_type,status)
         VALUES ($1,$2,$3,$4,$5,'onsite','active')`,
        [fixture.job.id, fixture.org.id, fixture.department.id, fixture.recruiter.recruiterId, fixture.job.title],
      );
      for (const [i, candidate] of fixture.candidates.entries()) {
        const userId = randomUUID();
        const candidateId = randomUUID();
        const cvId = randomUUID();
        const appliedAt = new Date(start + i * 3_600_000);
        await client.query(
          `INSERT INTO users (user_id,email,password_hash,full_name,role,email_verified)
           VALUES ($1,$2,$3,$4,'candidate',true)`,
          [userId, `gd4-analytics-candidate-${i}-${runId}@ats.test`, passwordHash, candidate.name],
        );
        await client.query('INSERT INTO candidates (candidate_id,user_id) VALUES ($1,$2)', [candidateId, userId]);
        await client.query(
          `INSERT INTO cvs (cv_id,candidate_id,file_name,file_path,parsing_status) VALUES ($1,$2,$3,$4,'completed')`,
          [cvId, candidateId, `gd4-analytics-${i}-${runId}.pdf`, `test-fixtures/gd4-analytics-${runId}/${i}.pdf`],
        );
        const status = candidate.path[candidate.path.length - 1];
        await client.query(
          `INSERT INTO applications (application_id,organization_id,job_id,candidate_id,cv_id,status,applied_at,current_stage_since)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$7)`,
          [candidate.applicationId, fixture.org.id, fixture.job.id, candidateId, cvId, status, appliedAt],
        );
        for (const [step, toStatus] of candidate.path.entries()) {
          await client.query(
            `INSERT INTO application_history (id,organization_id,application_id,from_status,to_status,changed_by,changed_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [randomUUID(), fixture.org.id, candidate.applicationId, step === 0 ? null : candidate.path[step - 1], toStatus,
              fixture.recruiter.userId, new Date(appliedAt.getTime() + step * DAY)],
          );
        }
      }
      // 1 000 000 prompt tokens of the priced model, 10 of the unpriced one.
      await client.query(
        `INSERT INTO ai_usage_logs (log_id,action_type,reference_id,model_name,prompt_tokens,completion_tokens,duration_ms,status,organization_id,created_at)
         VALUES ($1,'cv_scoring','gd4',$2,1000000,0,10,'success',$3,now()), ($4,'job_parsing','gd4',$5,10,0,10,'success',$3,now())`,
        [randomUUID(), fixture.pricedModel, fixture.org.id, randomUUID(), fixture.unpricedModel],
      );
      await client.query(
        `INSERT INTO ai_model_prices (model_name,input_usd_per_million,output_usd_per_million,updated_at) VALUES ($1,2.5,10,now())`,
        [fixture.pricedModel],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
  return fixture;
}

export async function cleanupGd4AnalyticsFixtures(fixture) {
  assert.equal(fixture.org.slug, `gd4-analytics-${fixture.runId}`);
  return withDatabase(async (client) => {
    await client.query('BEGIN');
    try {
      await client.query('DELETE FROM ai_usage_logs WHERE organization_id=$1', [fixture.org.id]);
      await client.query('DELETE FROM ai_model_prices WHERE model_name=ANY($1)', [[fixture.pricedModel, fixture.unpricedModel]]);
      for (const table of ['application_history', 'applications', 'job_postings', 'recruiters', 'departments']) {
        await client.query(`DELETE FROM ${table} WHERE organization_id=$1`, [fixture.org.id]);
      }
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
