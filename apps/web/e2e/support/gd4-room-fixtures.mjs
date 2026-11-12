// Real PostgreSQL fixtures for the online interview room journey on docker-compose.test.yml. Never the dev DB.
// One online interview that started five minutes ago, so its built-in room is open now; the recruiter is both
// the scheduler and the interviewer, the candidate owns the application.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { withDatabase } from './gd1-fixtures.mjs';

export async function createGd4RoomFixtures(apiUrl, webUrl) {
  const api = new URL(apiUrl);
  assert.ok(['localhost', '127.0.0.1'].includes(api.hostname));
  assert.equal(api.port, '55000', 'Use the compose test API, never port 5000');
  const health = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(5_000) });
  assert.equal(health.status, 200);

  const runId = randomUUID();
  const suffix = runId.slice(0, 8);
  const phoneSuffix = String(Number.parseInt(suffix, 16) % 1_000_000).padStart(6, '0');
  const fixture = {
    runId,
    password: 'Gd4Test@123',
    org: { id: randomUUID(), name: `GĐ4 room organization ${suffix}`, slug: `gd4-room-${runId}` },
    department: { id: randomUUID() },
    recruiter: {
      userId: randomUUID(),
      recruiterId: randomUUID(),
      email: `gd4-room-recruiter-${runId}@ats.test`,
      name: `Phỏng vấn viên ${suffix}`,
      phone: `0986${phoneSuffix}`,
    },
    candidate: { userId: randomUUID(), email: `gd4-room-candidate-${runId}@ats.test`, name: `Ứng viên phòng ${suffix}` },
    // A verified candidate who is NOT in the interview: the API must refuse them a token.
    outsider: { userId: randomUUID(), email: `gd4-room-outsider-${runId}@ats.test`, name: `Người ngoài ${suffix}` },
    job: { id: randomUUID(), title: `GĐ4 room job ${suffix}` },
    applicationId: randomUUID(),
    interviewId: randomUUID(),
  };
  const passwordHash = await bcrypt.hash(fixture.password, 10);
  const startAt = new Date(Date.now() - 5 * 60_000);

  await withDatabase(async (client) => {
    await client.query('BEGIN');
    try {
      await client.query('INSERT INTO organizations (organization_id,name,slug) VALUES ($1,$2,$3)', [
        fixture.org.id, fixture.org.name, fixture.org.slug,
      ]);
      await client.query('INSERT INTO departments (department_id,organization_id,name,color) VALUES ($1,$2,$3,$4)', [
        fixture.department.id, fixture.org.id, `GĐ4 room department ${suffix}`, '#0071E3',
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
        `INSERT INTO job_postings (job_id,organization_id,department_id,created_by,title,location_type,status)
         VALUES ($1,$2,$3,$4,$5,'onsite','active')`,
        [fixture.job.id, fixture.org.id, fixture.department.id, fixture.recruiter.recruiterId, fixture.job.title],
      );
      const candidateId = randomUUID();
      const cvId = randomUUID();
      await client.query(
        `INSERT INTO users (user_id,email,password_hash,full_name,role,email_verified)
         VALUES ($1,$2,$3,$4,'candidate',true)`,
        [fixture.candidate.userId, fixture.candidate.email, passwordHash, fixture.candidate.name],
      );
      await client.query('INSERT INTO candidates (candidate_id,user_id) VALUES ($1,$2)', [candidateId, fixture.candidate.userId]);
      await client.query(
        `INSERT INTO users (user_id,email,password_hash,full_name,role,email_verified)
         VALUES ($1,$2,$3,$4,'candidate',true)`,
        [fixture.outsider.userId, fixture.outsider.email, passwordHash, fixture.outsider.name],
      );
      await client.query('INSERT INTO candidates (candidate_id,user_id) VALUES ($1,$2)', [randomUUID(), fixture.outsider.userId]);
      await client.query(
        `INSERT INTO cvs (cv_id,candidate_id,file_name,file_path,parsing_status)
         VALUES ($1,$2,$3,$4,'completed')`,
        [cvId, candidateId, `gd4-room-${runId}.pdf`, `test-fixtures/gd4-room-${runId}/cv.pdf`],
      );
      await client.query(
        `INSERT INTO applications (application_id,organization_id,job_id,candidate_id,cv_id,status,applied_at)
         VALUES ($1,$2,$3,$4,$5,'interview',$6)`,
        [fixture.applicationId, fixture.org.id, fixture.job.id, candidateId, cvId, new Date(Date.now() - 86_400_000)],
      );
      // start_at is a timestamp WITHOUT time zone holding UTC (as Prisma writes it). node-postgres sends a Date
      // with the machine's offset, which such a column would drop: convert to UTC explicitly.
      // The link the API itself would store for an online interview without an external link (GĐ4 R1).
      await client.query(
        `INSERT INTO interview_schedules (interview_id,organization_id,application_id,scheduled_by,interviewer_id,
                                          interview_type,start_at,duration_minutes,online_meeting_link,status)
         VALUES ($1,$2,$3,$4,$4,'online',($5::timestamptz AT TIME ZONE 'UTC'),60,$6,'scheduled')`,
        [fixture.interviewId, fixture.org.id, fixture.applicationId, fixture.recruiter.userId, startAt,
          `${webUrl.replace(/\/+$/, '')}/interview-room/${fixture.interviewId}`],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
  return fixture;
}

export async function cleanupGd4RoomFixtures(fixture) {
  assert.equal(fixture.org.slug, `gd4-room-${fixture.runId}`);
  return withDatabase(async (client) => {
    const owned = (await client.query('SELECT slug FROM organizations WHERE organization_id=$1', [fixture.org.id])).rows;
    assert.equal(owned.length, 1);
    assert.equal(owned[0].slug, fixture.org.slug);
    await client.query('BEGIN');
    try {
      for (const table of ['interview_schedules', 'application_history', 'applications', 'job_postings', 'recruiters', 'departments']) {
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
