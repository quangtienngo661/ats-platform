// Seed sample data for MANUAL testing of GĐ2 SP1–SP3 on the isolated test stack (docker-compose.test.yml).
// Usage (from the repo root on dev, test stack up and prepare-local.mjs already run):
//   node <path-to-this-file> 1     # SP1: scorecard, notes, comparison
//   node <path-to-this-file> 2     # SP2: bulk screening, CSV export
//   node <path-to-this-file> 3     # SP3: candidate emails (Mailpit)
// Unlike the E2E journeys it does NOT clean up, so the data stays for you to click through.
// It reuses the E2E fixture creators, so the data is exactly what each E2E journey starts from.
// Test-only accounts in the isolated ats_test database; the output goes to your terminal only.

const API = 'http://localhost:55000/api';
// All three are on dev now: load the fixtures from this checkout (repo root = four levels up).
const root = new URL('../../../../', import.meta.url);
const sp = {
  1: { file: 'gd2-fixtures.mjs', fn: 'createGd2EvaluationFixtures' },
  2: { file: 'gd2-bulk-fixtures.mjs', fn: 'createGd2BulkFixtures' },
  3: { file: 'gd2-email-fixtures.mjs', fn: 'createGd2EmailFixtures' },
}[process.argv[2]];
if (!sp) throw new Error('Usage: node seed.mjs <1|2|3>');

const mod = await import(new URL(`apps/web/e2e/support/${sp.file}`, root).href);
const fixture = await mod[sp.fn](API);

// Print only what a person needs to log in and find the data.
const accounts = [];
const titles = [];
const walk = (value, path) => {
  if (!value || typeof value !== 'object') return;
  if (typeof value.email === 'string') accounts.push({ who: path, email: value.email, name: value.name });
  if (typeof value.title === 'string') titles.push({ where: path, title: value.title });
  for (const [key, child] of Object.entries(value)) walk(child, path ? `${path}.${key}` : key);
};
walk(fixture, '');

console.log(`\nSP${process.argv[2]} sample data created in the test database (not cleaned up).`);
console.log('Organization:', fixture.org?.name);
console.table(accounts);
console.table(titles);
console.log('Password for the accounts above:', fixture.password);
console.log('Web login: http://localhost:3001/sign-in  (recruiter)   API: http://localhost:55000/api');
