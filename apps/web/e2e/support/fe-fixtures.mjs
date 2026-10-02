// Synthetic records in ats_test only; no uploads or external AI are triggered.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { createGd1Fixtures, cleanupGd1Fixtures } from './gd1-fixtures.mjs';

async function withDatabase(operation) {
  const pool = new pg.Pool({ connectionString: 'postgresql://ats_test:ats-local-test@localhost:55432/ats_test' });
  try {
    assert.equal((await pool.query('SELECT current_database() AS name')).rows[0].name, 'ats_test');
    return await operation(pool);
  } finally {
    await pool.end();
  }
}

export async function createFeFixtures(apiUrl) {
  const base = await createGd1Fixtures(apiUrl);
  const fixture = {
    ...base,
    topicId: randomUUID(),
    sessionId: randomUUID(),
    question: 'Giải thích cách React quản lý state trong một component.',
    answer: 'State lưu dữ liệu của component và cập nhật giao diện.',
    cvName: 'Frontend-example.pdf',
    jobs: ['remote', 'onsite', 'hybrid'].map((locationType) => ({
      id: randomUUID(), locationType, title: `FE sample ${base.runId.slice(0, 8)} ${locationType}`,
    })),
  };
  try {
    await withDatabase(async (pool) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('UPDATE cvs SET file_name=$1 WHERE cv_id=$2 AND candidate_id=$3', [fixture.cvName, fixture.candidate.cvId, fixture.candidate.id]);
        await client.query(
          `INSERT INTO cv_parsed_data (id,cv_id,summary,skills,experience,education,projects,certificates,is_confirmed)
           VALUES ($1,$2,$3,$4,'[]','[]','[]','[]',true)`,
          [randomUUID(), fixture.candidate.cvId, 'Hồ sơ mẫu cho kiểm thử frontend', JSON.stringify({ technical: ['React', 'TypeScript'], soft: [], languages: [] })],
        );
        for (const job of fixture.jobs) {
          await client.query(
            `INSERT INTO job_postings (job_id,organization_id,department_id,created_by,title,location_type,status,description,published_at)
             VALUES ($1,$2,$3,$4,$5,$6,'active',$7,now())`,
            [job.id, fixture.orgB.id, fixture.departmentB.id, fixture.recruiterB.id, job.title, job.locationType,
              '<p onclick="alert(1)">Mô tả <strong>React</strong></p><script>window.__unsafeHtml=true</script>'],
          );
        }
        await client.query('INSERT INTO interview_topics (topic_id,name) VALUES ($1,$2)', [fixture.topicId, `FE topic ${fixture.runId.slice(0, 8)}`]);
        await client.query(
          `INSERT INTO interview_sessions (session_id,candidate_id,topic_id,difficulty_level,status) VALUES ($1,$2,$3,'easy','in_progress')`,
          [fixture.sessionId, fixture.candidate.id, fixture.topicId],
        );
        await client.query(
          `INSERT INTO interview_qnas (qna_id,session_id,order_index,difficulty,question_text,answer_text)
           VALUES ($1,$2,1,'easy','State trong React là gì?',$3),($4,$2,2,'easy',$5,null)`,
          [randomUUID(), fixture.sessionId, fixture.answer, randomUUID(), fixture.question],
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
    return fixture;
  } catch (error) {
    await cleanupFeFixtures(fixture);
    throw error;
  }
}

export async function cleanupFeFixtures(fixture) {
  await withDatabase(async (pool) => {
    await pool.query('DELETE FROM interview_sessions WHERE session_id=$1 AND candidate_id=$2', [fixture.sessionId, fixture.candidate.id]);
    await pool.query('DELETE FROM interview_topics WHERE topic_id=$1', [fixture.topicId]);
  });
  return cleanupGd1Fixtures(fixture);
}
