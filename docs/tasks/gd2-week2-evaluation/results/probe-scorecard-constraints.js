// Verifies scorecard and note constraints on a throwaway PostgreSQL database.
// Every probe uses a SAVEPOINT in one transaction that is rolled back; nothing is left behind.
(async () => {
  require(require.resolve('dotenv/config', { paths: [process.cwd()] }));
  const { Client } = require(require.resolve('pg', { paths: [process.cwd()] }));
  const url = new URL(process.env.DATABASE_URL);
  url.hostname = 'localhost';
  const c = new Client({ connectionString: url.toString() });
  const out = (s) => console.log(s);
  const errorDetail = (e) => `${e.code ?? 'no SQLSTATE'} ${e.constraint ?? e.message}`;
  let failures = 0;

  const probe = async (label, run) => {
    await c.query('SAVEPOINT p');
    try {
      const { ok, detail } = await run();
      out(`${ok ? 'PASS' : 'FAIL'} — ${label}: ${detail}`);
      if (!ok) failures++;
    } catch (e) {
      out(`FAIL — ${label}: ${errorDetail(e)}`);
      failures++;
    } finally {
      await c.query('ROLLBACK TO SAVEPOINT p');
      await c.query('RELEASE SAVEPOINT p');
    }
  };

  // Only the statement under test may satisfy an expected rejection, never its setup.
  const reject = async (sql, params, expectedCode, expectedConstraint) => {
    try {
      await c.query(sql, params);
      return { ok: false, detail: `accepted; expected SQLSTATE ${expectedCode}` };
    } catch (e) {
      return {
        ok: e.code === expectedCode &&
          (expectedConstraint === undefined || e.constraint === expectedConstraint),
        detail: `rejected (${errorDetail(e)}); expected SQLSTATE ${expectedCode}`,
      };
    }
  };

  let organizationId;
  try {
    await c.connect();
    await c.query('BEGIN');
    try {
      const org = await c.query(
        `INSERT INTO organizations (organization_id, name, slug)
         VALUES (gen_random_uuid()::text, 'scorecard constraint probe',
                 'probe-scorecard-' || gen_random_uuid()::text)
         RETURNING organization_id`,
      );
      organizationId = org.rows[0].organization_id;

      const department = await c.query(
        `INSERT INTO departments (department_id, organization_id, name)
         VALUES (gen_random_uuid()::text, $1, 'probe department')
         RETURNING department_id`,
        [organizationId],
      );
      const departmentId = department.rows[0].department_id;

      // Candidate/recruiter users carry no organization_id (users_org_admin_binding_check).
      const userSql = `INSERT INTO users (user_id, email, password_hash, full_name, role)
                       VALUES (gen_random_uuid()::text, $1, 'x', 'probe', $2::user_role)
                       RETURNING user_id`;
      const candidateUser = await c.query(userSql, [
        `probe-candidate-${organizationId}@local.test`, 'candidate',
      ]);
      const interviewer = await c.query(userSql, [
        `probe-interviewer-${organizationId}@local.test`, 'recruiter',
      ]);
      const authorId = interviewer.rows[0].user_id;

      const recruiter = await c.query(
        `INSERT INTO recruiters (recruiter_id, user_id, organization_id, department_id)
         VALUES (gen_random_uuid()::text, $1, $2, $3)
         RETURNING recruiter_id`,
        [authorId, organizationId, departmentId],
      );
      const candidate = await c.query(
        `INSERT INTO candidates (candidate_id, user_id)
         VALUES (gen_random_uuid()::text, $1) RETURNING candidate_id`,
        [candidateUser.rows[0].user_id],
      );
      const candidateId = candidate.rows[0].candidate_id;
      const cv = await c.query(
        `INSERT INTO cvs (cv_id, candidate_id, file_name, file_path)
         VALUES (gen_random_uuid()::text, $1, 'probe.pdf', 'probe/scorecard.pdf')
         RETURNING cv_id`,
        [candidateId],
      );
      // created_by references recruiters.recruiter_id, not users.user_id.
      const job = await c.query(
        `INSERT INTO job_postings
           (job_id, organization_id, department_id, created_by, title, location_type)
         VALUES (gen_random_uuid()::text, $1, $2, $3, 'probe job', 'remote')
         RETURNING job_id`,
        [organizationId, departmentId, recruiter.rows[0].recruiter_id],
      );
      const application = await c.query(
        `INSERT INTO applications (application_id, organization_id, job_id, candidate_id, cv_id)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4) RETURNING application_id`,
        [organizationId, job.rows[0].job_id, candidateId, cv.rows[0].cv_id],
      );
      const applicationId = application.rows[0].application_id;
      const interview = await c.query(
        `INSERT INTO interview_schedules
           (interview_id, organization_id, application_id, scheduled_by, interviewer_id,
            interview_type, start_at, status)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $3, 'online', CURRENT_TIMESTAMP, 'completed')
         RETURNING interview_id`,
        [organizationId, applicationId, authorId],
      );
      const interviewId = interview.rows[0].interview_id;

      const scorecardSql = `INSERT INTO interview_scorecards
          (id, organization_id, interview_id, author_id, technical_skills, problem_solving,
           communication, culture_fit, recommendation, comment, submitted_at, updated_at)
        VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7,
                'yes', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
      const scorecardParams = (scores) => [organizationId, interviewId, authorId, ...scores];
      const insertScorecard = (scores) => c.query(scorecardSql, scorecardParams(scores));
      const scoreColumns = ['technical_skills', 'problem_solving', 'communication', 'culture_fit'];

      for (const [index, column] of scoreColumns.entries()) {
        for (const invalid of [0, 6]) {
          const scores = [3, 3, 3, 3];
          scores[index] = invalid;
          await probe(`CHECK ${column} rejects ${invalid}`, () =>
            reject(scorecardSql, scorecardParams(scores), '23514'));
        }
      }

      // Controls ensure valid boundary values are accepted by all four CHECKs.
      for (const boundary of [1, 5]) {
        await probe(`CONTROL all four scores accept ${boundary}`, async () => {
          const result = await insertScorecard([boundary, boundary, boundary, boundary]);
          return { ok: result.rowCount === 1, detail: `accepted ${result.rowCount} scorecard(s)` };
        });
      }

      await probe('UNIQUE rejects a second scorecard for the same interview_id', async () => {
        await insertScorecard([3, 3, 3, 3]);
        return reject(scorecardSql, scorecardParams([3, 3, 3, 3]), '23505');
      });

      await probe('FK RESTRICT rejects deleting an interview with a scorecard', async () => {
        await insertScorecard([3, 3, 3, 3]);
        return reject(
          'DELETE FROM interview_schedules WHERE interview_id = $1', [interviewId], '23001',
          'interview_scorecards_interview_id_fkey',
        );
      });

      await probe('CASCADE deleting an application removes its notes', async () => {
        await c.query(
          `INSERT INTO application_notes
             (id, organization_id, application_id, author_id, body, created_at, updated_at)
           VALUES (gen_random_uuid()::text, $1, $2, $3, 'probe note',
                   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [organizationId, applicationId, authorId],
        );
        const countSql = 'SELECT count(*)::int n FROM application_notes WHERE application_id = $1';
        const before = (await c.query(countSql, [applicationId])).rows[0].n;
        // The existing schedule FK restricts application deletion; remove this fixture first.
        // Other probes' scorecards have already been rolled back to their SAVEPOINTs.
        await c.query('DELETE FROM interview_schedules WHERE interview_id = $1', [interviewId]);
        const deleted = await c.query(
          'DELETE FROM applications WHERE application_id = $1', [applicationId],
        );
        const after = (await c.query(countSql, [applicationId])).rows[0].n;
        return {
          ok: before === 1 && deleted.rowCount === 1 && after === 0,
          detail: `notes ${before} before -> ${after} after; applications deleted: ${deleted.rowCount}`,
        };
      });

      await probe('ENUM scorecard_recommendation has exactly the four specified values', async () => {
        const result = await c.query(
          'SELECT unnest(enum_range(NULL::scorecard_recommendation))::text AS v',
        );
        const actual = result.rows.map((r) => r.v);
        const expected = ['strong_no', 'no', 'yes', 'strong_yes'];
        return {
          ok: actual.length === expected.length && expected.every((v) => actual.includes(v)),
          detail: actual.join(', '),
        };
      });
    } finally {
      await c.query('ROLLBACK');
    }

    // Audit after ROLLBACK, scoped to this run's generated organization ID.
    for (const table of ['interview_scorecards', 'application_notes']) {
      try {
        const left = await c.query(
          `SELECT count(*)::int n FROM ${table} WHERE organization_id = $1`, [organizationId],
        );
        const n = left.rows[0].n;
        out(`${n === 0 ? 'PASS' : 'FAIL'} — probe rows left behind (${table}): ${n}`);
        if (n !== 0) failures++;
      } catch (e) {
        out(`FAIL — probe rows left behind (${table}): ${errorDetail(e)}`);
        failures++;
      }
    }
  } finally {
    await c.end();
  }

  out(failures === 0 ? 'RESULT: all checks passed' : `RESULT: ${failures} failure(s)`);
  process.exitCode = failures === 0 ? 0 : 1;
})().catch((e) => {
  console.error(`ERROR: ${e.code ?? 'no SQLSTATE'} ${e.message}`);
  console.error('RESULT: unexpected error');
  process.exitCode = 2;
});
