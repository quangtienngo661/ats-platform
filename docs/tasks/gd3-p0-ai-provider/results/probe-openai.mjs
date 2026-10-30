// P0-C11 probe — real OpenAI calls. Run only with the owner's permission (it spends money).
//
//   DOTENV_CONFIG_PATH=<path to the .env that holds OPENAI_API_KEY> node probe-openai.mjs
//
// The key is read from the environment/.env by this process only; it is never printed.
// Every error message is redacted of anything shaped like a key before it is shown.
import 'dotenv/config';
import { OpenAI } from 'openai';

const redact = (text) => String(text).replace(/sk-[A-Za-z0-9_\-*.]+/g, 'sk-[redacted]');
const log = (...parts) => console.log(...parts.map((p) => (typeof p === 'string' ? redact(p) : p)));

if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set (check DOTENV_CONFIG_PATH). Nothing was called.');
  process.exit(1);
}
log('OPENAI_API_KEY present: true');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0, timeout: 120_000 });
const MODELS = {
  flash: process.env.OPENAI_MODEL_FLASH || 'gpt-6-luna',
  pro: process.env.OPENAI_MODEL_PRO || 'gpt-6.1-sol',
};

async function generate(label, { model, effort, instructions, input }) {
  const started = performance.now();
  try {
    const response = await client.responses.create({
      model,
      instructions,
      input,
      text: { format: { type: 'json_object' } },
      reasoning: { effort },
    });
    log(`\n[${label}] OK model=${response.model} effort=${effort} ${Math.round(performance.now() - started)}ms`);
    log('  output_text:', response.output_text);
    log('  usage:', JSON.stringify(response.usage));
    let parsed = true;
    try { JSON.parse(response.output_text); } catch { parsed = false; }
    log('  output_text parses as JSON:', String(parsed));
  } catch (error) {
    log(`\n[${label}] ERROR model=${model} effort=${effort}: status=${error?.status} message=${error?.message}`);
  }
}

const JSON_PROMPT = 'Reply with a JSON object {"ok": true, "skill": "<the skill named in the input>"}.';

// 1–2. JSON mode + reasoning effort on both models named in the spec.
await generate('flash medium', { model: MODELS.flash, effort: 'medium', instructions: JSON_PROMPT, input: 'Skill: ReactJS' });
await generate('pro high', { model: MODELS.pro, effort: 'high', instructions: JSON_PROMPT, input: 'Skill: PostgreSQL' });

// 3. Does json_object demand the word "JSON" somewhere? (the real prompts all contain it)
await generate('flash medium, no "JSON" anywhere', { model: MODELS.flash, effort: 'medium', instructions: 'Answer briefly.', input: 'Name one database.' });

// 4. Embeddings: dimension with and without the explicit parameter, and similarity ordering.
const TEXTS = ['ReactJS', 'React.js', 'PostgreSQL', 'lập trình hướng đối tượng', 'OOP'];
const cosine = (a, b) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
};
try {
  const explicit = await client.embeddings.create({ model: 'text-embedding-3-small', input: TEXTS, dimensions: 1536, encoding_format: 'float' });
  const implicit = await client.embeddings.create({ model: 'text-embedding-3-small', input: TEXTS, encoding_format: 'float' });
  const vectors = explicit.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
  log('\n[embeddings] explicit dimensions=1536 → length:', String(vectors[0].length), 'usage:', JSON.stringify(explicit.usage));
  log('[embeddings] default (no dimensions)      → length:', String(implicit.data[0].embedding.length));
  log('[embeddings] cosine matrix (rows/cols = ' + JSON.stringify(TEXTS) + ')');
  for (let i = 0; i < vectors.length; i++) {
    log('  ' + TEXTS[i].padEnd(28) + vectors.map((v) => cosine(vectors[i], v).toFixed(3)).join('  '));
  }
  const near = cosine(vectors[0], vectors[1]);
  const far = cosine(vectors[0], vectors[2]);
  log(`[embeddings] cos(ReactJS, React.js)=${near.toFixed(3)} > cos(ReactJS, PostgreSQL)=${far.toFixed(3)} :`, String(near > far));
  log(`[embeddings] cos(lập trình hướng đối tượng, OOP)=${cosine(vectors[3], vectors[4]).toFixed(3)}`);
} catch (error) {
  log(`\n[embeddings] ERROR status=${error?.status} message=${error?.message}`);
}
