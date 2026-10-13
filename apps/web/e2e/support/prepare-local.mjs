// Fixtures for docker-compose.test.yml only. No development credentials or data.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import bcrypt from 'bcrypt';
import Redis from 'ioredis';

const api = 'http://localhost:55000/api';
const health = await fetch(`${api}/health`, { signal: AbortSignal.timeout(5_000) });
assert.equal(health.status, 200, 'Compose test API must be ready');
assert.equal((await health.json()).data.status, 'up');
const pool = new pg.Pool({ connectionString: 'postgresql://ats_test:ats-local-test@localhost:55432/ats_test' });
const client = await pool.connect();
try {
  assert.equal((await client.query('SELECT current_database() AS name')).rows[0].name, 'ats_test');
  await client.query('BEGIN');
  await client.query(
    `INSERT INTO organizations (organization_id, name, slug) VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO NOTHING`,
    [randomUUID(), 'Tổ chức kiểm chứng E2E', 'e2e-defect-verification'],
  );
  const org = (await client.query('SELECT organization_id FROM organizations WHERE slug=$1', ['e2e-defect-verification'])).rows[0];
  await client.query(
    `INSERT INTO ai_configs (config_id, organization_id, name, is_default, skills_weight,
     experience_weight, education_weight, minimum_score_threshold)
     SELECT $1, $2, 'Default CV Screening Config', true, 0.4, 0.4, 0.2, 60
     WHERE NOT EXISTS (SELECT 1 FROM ai_configs WHERE organization_id=$2 AND is_default=true)`,
    [randomUUID(), org.organization_id],
  );
  await client.query(
    `INSERT INTO users (user_id, email, password_hash, full_name, role, email_verified)
     VALUES ($1, $2, $3, $4, 'candidate', true) ON CONFLICT (email) DO NOTHING`,
    [randomUUID(), 'candidate-e2e@ats.test', await bcrypt.hash('Candidate@123', 10), 'Ứng viên E2E'],
  );
  const candidate = (await client.query('SELECT user_id, role, email_verified FROM users WHERE email=$1', ['candidate-e2e@ats.test'])).rows[0];
  assert.equal(candidate.role, 'candidate');
  assert.equal(candidate.email_verified, true);
  await client.query('INSERT INTO candidates (candidate_id, user_id) VALUES ($1,$2) ON CONFLICT (user_id) DO NOTHING', [randomUUID(), candidate.user_id]);
  await client.query('COMMIT');
  await writeFile('docs/tasks/test-defect-fixes/results/local-fixture.json', JSON.stringify({
    api, organizationId: org.organization_id, organizationSlug: 'e2e-defect-verification',
  }, null, 2) + '\n');
  console.log('Organization and verified candidate fixtures ready in ats_test. No tokens recorded.');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}

// A run needs five real logins. Respect the real 5/minute limit after prior runs;
// wait for counters to expire naturally instead of disabling or deleting them.
const redis = new Redis({ host: 'localhost', port: 56379, maxRetriesPerRequest: 1 });
try {
  let cursor = '0';
  const keys = [];
  do {
    const page = await redis.scan(cursor, 'MATCH', 'throttle:*', 'COUNT', 100);
    cursor = page[0];
    keys.push(...page[1]);
  } while (cursor !== '0');
  const remaining = Math.max(0, ...await Promise.all(keys.map(key => redis.pttl(key))));
  if (remaining > 0) {
    console.log(`Waiting ${Math.ceil(remaining / 1000)}s for the local auth limit to expire.`);
    await new Promise(resolve => setTimeout(resolve, remaining + 100));
  }
} finally {
  await redis.quit();
}
