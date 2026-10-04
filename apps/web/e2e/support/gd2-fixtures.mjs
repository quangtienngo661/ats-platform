// Real PostgreSQL fixtures for the GĐ2 schedule journey on docker-compose.test.yml. Never the dev DB.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { withDatabase } from './gd1-fixtures.mjs';

/** One organization, a recruiter in the job's department, and a candidate whose application is at `interview`. */
export async function createGd2ScheduleFixtures(apiUrl) {
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
    org: { id: randomUUID(), name: `GĐ2 tổ chức ${suffix}`, slug: `gd2-${runId}` },
    department: { id: randomUUID() },
    recruiter: {
      userId: randomUUID(),
      recruiterId: randomUUID(),
      email: `gd2-recruiter-${runId}@ats.test`,
      name: `Recruiter GĐ2 ${suffix}`,
      phone: `0987${String(Number.parseInt(suffix, 16) % 1_000_000).padStart(6, '0')}`,
    },
    candidate: { userId: randomUUID(), candidateId: randomUUID(), cvId: randomUUID(), email: `gd2-candidate-${runId}@ats.test` },
    job: { id: randomUUID(), title: `GĐ2 tin ${suffix}` },
    applicationId: randomUUID(),
    internalNote: `GĐ2 ghi chú nội bộ ${runId}`,
  };

  await withDatabase(async (client) => {
    await client.query('BEGIN');
    try {
      await client.query('INSERT INTO organizations (organization_id,name,slug) VALUES ($1,$2,$3)', [
        fixture.org.id, fixture.org.name, fixture.org.slug,
      ]);
      await client.query('INSERT INTO departments (department_id,organization_id,name,color) VALUES ($1,$2,$3,$4)', [
        fixture.department.id, fixture.org.id, `GĐ2 phòng ${suffix}`, '#0071E3',
      ]);
      const passwordHash = await bcrypt.hash(fixture.password, 10);
      await client.query(
        `INSERT INTO users (user_id,email,password_hash,full_name,role,email_verified,phone_number)
         VALUES ($1,$2,$3,$4,'recruiter',true,$5)`,
        [fixture.recruiter.userId, fixture.recruiter.email, passwordHash, fixture.recruiter.name, fixture.recruiter.phone],
      );
      await client.query(
        'INSERT INTO recruiters (recruiter_id,user_id,organization_id,department_id,position) VALUES ($1,$2,$3,$4,$5)',
        [fixture.recruiter.recruiterId, fixture.recruiter.userId, fixture.org.id, fixture.department.id, 'Interviewer GĐ2'],
      );
      await client.query(
        `INSERT INTO users (user_id,email,password_hash,full_name,role,email_verified)
         VALUES ($1,$2,$3,$4,'candidate',true)`,
        [fixture.candidate.userId, fixture.candidate.email, passwordHash, `Ứng viên GĐ2 ${suffix}`],
      );
      await client.query('INSERT INTO candidates (candidate_id,user_id) VALUES ($1,$2)', [
        fixture.candidate.candidateId, fixture.candidate.userId,
      ]);
      await client.query(
        `INSERT INTO cvs (cv_id,candidate_id,file_name,file_path,parsing_status) VALUES ($1,$2,$3,$4,'completed')`,
        [fixture.candidate.cvId, fixture.candidate.candidateId, `gd2-${runId}.pdf`, `test-fixtures/gd2-${runId}.pdf`],
      );
      await client.query(
        `INSERT INTO job_postings (job_id,organization_id,department_id,created_by,title,location_type,status)
         VALUES ($1,$2,$3,$4,$5,'onsite','active')`,
        [fixture.job.id, fixture.org.id, fixture.department.id, fixture.recruiter.recruiterId, fixture.job.title],
      );
      await client.query(
        `INSERT INTO applications (application_id,organization_id,job_id,candidate_id,cv_id,status)
         VALUES ($1,$2,$3,$4,$5,'interview')`,
        [fixture.applicationId, fixture.org.id, fixture.job.id, fixture.candidate.candidateId, fixture.candidate.cvId],
      );
      // The steps that led to `interview`, one carrying a staff-only note (slice 2).
      // Times go to a column without a timezone: the journey runs under TZ=UTC.
      const daysAgo = (days) => new Date(Date.now() - days * 86_400_000);
      for (const [fromStatus, toStatus, when, notes] of [
        [null, 'applied', daysAgo(3), null],
        ['applied', 'screening', daysAgo(2), fixture.internalNote],
        ['screening', 'interview', daysAgo(1), null],
      ]) {
        await client.query(
          `INSERT INTO application_history (id,organization_id,application_id,from_status,to_status,changed_by,notes,changed_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [randomUUID(), fixture.org.id, fixture.applicationId, fromStatus, toStatus, fixture.recruiter.userId, notes, when],
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

/**
 * The schedules of the run's application, start times rendered by PostgreSQL as UTC ISO
 * strings: the column has no timezone, and node-pg would otherwise read it in the
 * process timezone.
 */
export async function schedulesOf(applicationId) {
  return withDatabase(async (client) => (await client.query(
    `SELECT to_char(start_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "startAt", interview_type AS "interviewType",
            online_meeting_link AS "onlineMeetingLink", location, status
     FROM interview_schedules WHERE application_id=$1 ORDER BY start_at`,
    [applicationId],
  )).rows);
}

export async function cleanupGd2Fixtures(fixture) {
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

/**
 * Job board data for the filter journey (slice 3): one organization with five postings
 * whose titles carry a per-run token, so a search by that token isolates them from any
 * other data in `ats_test`.
 *   one   active  10–20 million, skill A                → remote
 *   two   active  15 million only (min only), skill C  → onsite
 *   three active  8 million only (max only), skill A    → hybrid
 *   four  active  no salary                             → remote
 *   draft draft   10–20 million, skill B                (must never reach a visitor)
 * `skills` has no organization column, so cleanup deletes the run's skills by id.
 */
export async function createGd2JobFilterFixtures(apiUrl) {
  const api = new URL(apiUrl);
  assert.ok(['localhost', '127.0.0.1'].includes(api.hostname));
  assert.equal(api.port, '55000', 'Use the compose test API, never port 5000');
  const health = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(5_000) });
  assert.equal(health.status, 200);
  assert.equal((await health.json()).data.status, 'up');

  const runId = randomUUID();
  const suffix = runId.slice(0, 8);
  const token = `gd2f${suffix}`;
  const job = (key, title) => ({ id: randomUUID(), key, title: `${title} ${token}` });
  const fixture = {
    runId,
    token,
    org: { id: randomUUID(), name: `GĐ2 lọc việc ${suffix}`, slug: `gd2-filter-${runId}` },
    department: { id: randomUUID() },
    recruiter: { userId: randomUUID(), recruiterId: randomUUID(), email: `gd2-filter-recruiter-${runId}@ats.test` },
    skills: {
      a: { id: randomUUID(), name: `${token} A` },
      b: { id: randomUUID(), name: `${token} B` },
      c: { id: randomUUID(), name: `${token} C` },
    },
    jobs: {
      one: job('one', 'Lọc một'),
      two: job('two', 'Lọc hai'),
      three: job('three', 'Lọc ba'),
      four: job('four', 'Lọc bốn'),
      draft: job('draft', 'Lọc nháp'),
    },
  };

  // [job, status, salary_min, salary_max, location_type, skills]
  const rows = [
    [fixture.jobs.one, 'active', 10_000_000, 20_000_000, 'remote', [fixture.skills.a]],
    [fixture.jobs.two, 'active', 15_000_000, null, 'onsite', [fixture.skills.c]],
    [fixture.jobs.three, 'active', null, 8_000_000, 'hybrid', [fixture.skills.a]],
    [fixture.jobs.four, 'active', null, null, 'remote', []],
    [fixture.jobs.draft, 'draft', 10_000_000, 20_000_000, 'remote', [fixture.skills.b]],
  ];

  await withDatabase(async (client) => {
    await client.query('BEGIN');
    try {
      await client.query('INSERT INTO organizations (organization_id,name,slug) VALUES ($1,$2,$3)', [
        fixture.org.id, fixture.org.name, fixture.org.slug,
      ]);
      await client.query('INSERT INTO departments (department_id,organization_id,name,color) VALUES ($1,$2,$3,$4)', [
        fixture.department.id, fixture.org.id, `GĐ2 phòng lọc ${suffix}`, '#0071E3',
      ]);
      await client.query(
        `INSERT INTO users (user_id,email,password_hash,full_name,role,email_verified)
         VALUES ($1,$2,$3,$4,'recruiter',true)`,
        [fixture.recruiter.userId, fixture.recruiter.email, await bcrypt.hash('Gd2Test@123', 10), `Recruiter lọc ${suffix}`],
      );
      await client.query(
        'INSERT INTO recruiters (recruiter_id,user_id,organization_id,department_id,position) VALUES ($1,$2,$3,$4,$5)',
        [fixture.recruiter.recruiterId, fixture.recruiter.userId, fixture.org.id, fixture.department.id, 'Recruiter'],
      );
      for (const skill of Object.values(fixture.skills)) {
        await client.query('INSERT INTO skills (skill_id,name) VALUES ($1,$2)', [skill.id, skill.name]);
      }
      for (const [index, [posting, status, min, max, locationType, skills]] of rows.entries()) {
        await client.query(
          `INSERT INTO job_postings (job_id,organization_id,department_id,created_by,title,location_type,status,salary_min,salary_max,published_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [posting.id, fixture.org.id, fixture.department.id, fixture.recruiter.recruiterId, posting.title,
            locationType, status, min, max, new Date(Date.now() - index * 60_000)],
        );
        for (const skill of skills) {
          await client.query(
            'INSERT INTO job_posting_skills (id,organization_id,job_id,skill_id,is_required) VALUES ($1,$2,$3,$4,true)',
            [randomUUID(), fixture.org.id, posting.id, skill.id],
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

export async function cleanupGd2JobFilterFixtures(fixture) {
  return withDatabase(async (client) => {
    const owned = (await client.query('SELECT slug FROM organizations WHERE organization_id=$1', [fixture.org.id])).rows;
    assert.equal(owned.length, 1);
    assert.equal(owned[0].slug, fixture.org.slug);
    const skillIds = Object.values(fixture.skills).map((skill) => skill.id);
    await client.query('BEGIN');
    try {
      for (const table of ['job_posting_skills', 'job_postings', 'recruiters', 'departments']) {
        await client.query(`DELETE FROM ${table} WHERE organization_id=$1`, [fixture.org.id]);
      }
      await client.query('DELETE FROM skills WHERE skill_id=ANY($1::text[])', [skillIds]);
      await client.query('DELETE FROM users WHERE email=$1', [fixture.recruiter.email]);
      await client.query('DELETE FROM organizations WHERE organization_id=$1', [fixture.org.id]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    return {
      organizationsRemaining: Number((await client.query('SELECT count(*) AS count FROM organizations WHERE organization_id=$1', [fixture.org.id])).rows[0].count),
      skillsRemaining: Number((await client.query('SELECT count(*) AS count FROM skills WHERE skill_id=ANY($1::text[])', [skillIds])).rows[0].count),
      usersRemaining: Number((await client.query('SELECT count(*) AS count FROM users WHERE email=$1', [fixture.recruiter.email])).rows[0].count),
    };
  });
}
