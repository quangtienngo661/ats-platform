// C15 probe (Task 2.3) — REAL OpenAI embedding calls. Run only with the owner's permission (it spends money:
// one embeddings request of 14 short strings, a few hundred tokens).
//
//   DOTENV_CONFIG_PATH=<path to the .env that holds OPENAI_API_KEY> node probe-threshold.mjs
//
// It prints the cosine similarity of the pairs that decide the skill-match threshold τ
// (SKILL_MATCH_THRESHOLD) and, from them, the widest gap between "same skill" and "different skill" pairs.
// The key is never printed; error text is redacted of anything shaped like a key.
import 'dotenv/config';
import { OpenAI } from 'openai';

const redact = (text) => String(text).replace(/sk-[A-Za-z0-9_\-*.]+/g, 'sk-[redacted]');

if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set (check DOTENV_CONFIG_PATH). Nothing was called.');
  process.exit(1);
}

const same = [
  ['ReactJS', 'React.js'],
  ['Node', 'Node.js'],
  ['PostgreSQL', 'Postgres'],
  ['lập trình hướng đối tượng', 'OOP'],
  ['cơ sở dữ liệu', 'Database'],
];
const different = [
  ['ReactJS', 'PostgreSQL'],
  ['Java', 'JavaScript'],
];

const texts = [...new Set([...same, ...different].flat())];
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0, timeout: 120_000 });

const cosine = (a, b) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i += 1) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
};

try {
  const response = await client.embeddings.create({ model: 'text-embedding-3-small', input: texts, dimensions: 1536, encoding_format: 'float' });
  const vector = new Map(response.data.map((item) => [texts[item.index], item.embedding]));
  const score = ([a, b]) => ({ pair: `${a}  ~  ${b}`, cosine: cosine(vector.get(a), vector.get(b)) });

  console.log('\nSame skill (should be HIGH):');
  const sameScores = same.map(score);
  sameScores.forEach(({ pair, cosine: c }) => console.log(`  ${c.toFixed(3)}  ${pair}`));
  console.log('\nDifferent skill (should be LOW):');
  const differentScores = different.map(score);
  differentScores.forEach(({ pair, cosine: c }) => console.log(`  ${c.toFixed(3)}  ${pair}`));

  const lowestSame = Math.min(...sameScores.map((s) => s.cosine));
  const highestDifferent = Math.max(...differentScores.map((s) => s.cosine));
  console.log(`\nlowest "same" pair      : ${lowestSame.toFixed(3)}`);
  console.log(`highest "different" pair: ${highestDifferent.toFixed(3)}`);
  if (lowestSame > highestDifferent) {
    console.log(`a threshold between them works: e.g. ${((lowestSame + highestDifferent) / 2).toFixed(3)}`);
  } else {
    console.log('NO single threshold separates them; list the pairs that fail (the Vietnamese ones are the likely cause).');
  }
  console.log('Pairs below the default 0.8:', sameScores.filter((s) => s.cosine < 0.8).map((s) => s.pair).join(' | ') || 'none');
} catch (error) {
  console.error(redact(`Embedding probe failed: status=${error?.status} message=${error?.message}`));
  process.exit(1);
}
