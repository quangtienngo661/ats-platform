import bcrypt from 'bcrypt';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
const api = 'http://localhost:55000/api';
const pool = new pg.Pool({ connectionString: 'postgresql://ats_test:ats-local-test@localhost:55432/ats_test' });
const id = randomUUID().slice(0, 8);
const email = `p1-admin-${id}@ats.test`;
const skillId = randomUUID();
try {
  await pool.query(`INSERT INTO users (user_id,email,password_hash,full_name,role,email_verified) VALUES ($1,$2,$3,'P1 admin','admin',true)`, [randomUUID(), email, await bcrypt.hash('P1Admin@123', 10)]);
  await pool.query(`INSERT INTO skills (skill_id,name) VALUES ($1,$2)`, [skillId, `p1-probe-skill-${id}`]);
  const login = await fetch(`${api}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'P1Admin@123' }) });
  console.log('login', login.status);
  const token = (await login.json()).data.accessToken;
  const run = await fetch(`${api}/embeddings/backfill`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  console.log('backfill', run.status, JSON.stringify(await run.json()));
  // The three BullMQ attempts back off, so give the job time to fail for good.
  await new Promise((r) => setTimeout(r, 25000));
  const logs = await pool.query(`SELECT action_type, model_name, status, completion_tokens FROM ai_usage_logs WHERE reference_id=$1 ORDER BY created_at`, [skillId]);
  console.log('usage-log rows for the skill:', JSON.stringify(logs.rows));
  const embedded = await pool.query(`SELECT embedding IS NULL AS still_null FROM skills WHERE skill_id=$1`, [skillId]);
  console.log('skill embedding still null:', embedded.rows[0].still_null);
} finally {
  await pool.query(`DELETE FROM ai_usage_logs WHERE reference_id=$1`, [skillId]);
  await pool.query(`DELETE FROM skills WHERE skill_id=$1`, [skillId]);
  await pool.query(`DELETE FROM users WHERE email=$1`, [email]);
  await pool.end();
}
