// Task 1 of the SP3 plan: verify Mailpit AUTH acceptance and the quoted to: search syntax.
// The transport mirrors the API mail transport: auth is sent only when the server advertises AUTH.
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import nodemailer from 'nodemailer';

function parseArguments(args) {
  const flags = new Set(['--smtp-port', '--api-port', '--expect']);
  const values = new Map();

  if (args.length !== 6) return null;
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    if (!flags.has(flag) || values.has(flag)) return null;
    values.set(flag, args[index + 1]);
  }

  const parsePort = (value) => {
    if (!/^\d+$/.test(value)) return null;
    const port = Number(value);
    return Number.isInteger(port) && port >= 1 && port <= 65535 ? port : null;
  };
  const smtpPort = parsePort(values.get('--smtp-port'));
  const apiPort = parsePort(values.get('--api-port'));
  const expect = values.get('--expect');
  if (smtpPort === null || apiPort === null || !['ok', 'auth-refused'].includes(expect)) {
    return null;
  }
  return { smtpPort, apiPort, expect };
}

const options = parseArguments(process.argv.slice(2));
if (options === null) {
  console.error(
    'Usage: node docs/tasks/gd2-sp3-email-notifications/results/probe-mailpit.mjs ' +
      '--smtp-port N --api-port N --expect ok|auth-refused\n' +
      'Ports must be integers from 1 to 65535; provide each flag exactly once.',
  );
  process.exit(2);
}

const marker = randomUUID();
const address = `probe-${randomUUID()}@ats.test`;
const subject = `SP3 Mailpit probe ${marker}`;
let failures = 0;

function check(passed, description) {
  if (!passed) failures += 1;
  const line = String(description).replace(/[\r\n]+/g, ' ');
  console.log(`${passed ? 'PASS' : 'FAIL'} ${line}; address=${address}; marker=${marker}`);
  return passed;
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

async function getJson(url, timeoutMs) {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) {
    throw new Error(`GET ${url} returned HTTP ${response.status}`);
  }
  return response.json();
}

async function searchMessages(url) {
  const deadline = Date.now() + 10_000;
  let messages = [];
  while (Date.now() < deadline) {
    const result = await getJson(url, Math.max(1, deadline - Date.now()));
    if (!Array.isArray(result.messages)) {
      throw new Error('Mailpit search response is missing the messages array');
    }
    messages = result.messages;
    if (messages.length > 0) break;
    const remaining = deadline - Date.now();
    if (remaining > 0) await delay(Math.min(500, remaining));
  }
  return messages;
}

async function main() {
  const transport = nodemailer.createTransport({
    host: '127.0.0.1',
    port: options.smtpPort,
    secure: false,
    auth: { user: 'probe', pass: 'probe' },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });

  try {
    await transport.sendMail({
      from: 'SP3 Probe <probe@ats.test>',
      to: address,
      subject,
      text: `SP3 Mailpit probe marker: ${marker}`,
      html: `<p>SP3 Mailpit probe marker: ${marker}</p>`,
    });
    check(
      options.expect === 'ok',
      options.expect === 'ok'
        ? 'SMTP sendMail resolved with AUTH'
        : 'SMTP sendMail resolved; expected AUTH rejection',
    );
  } catch (error) {
    check(options.expect === 'auth-refused', `SMTP sendMail rejected: ${errorMessage(error)}`);
    return;
  } finally {
    transport.close();
  }

  if (options.expect === 'auth-refused') return;

  const apiUrl = `http://127.0.0.1:${options.apiPort}`;
  const query = `to:"${address}"`;
  const messages = await searchMessages(`${apiUrl}/api/v1/search?query=${encodeURIComponent(query)}`);
  if (!check(messages.length === 1, `to: search returned exactly one message (found ${messages.length})`)) {
    return;
  }

  const message = messages[0];
  check(message.Subject === subject, 'Search Subject equals the sent subject');
  if (!check(typeof message.ID === 'string' && message.ID.length > 0, 'Search message has an ID')) {
    return;
  }

  const detail = await getJson(`${apiUrl}/api/v1/message/${encodeURIComponent(message.ID)}`, 5_000);
  check(typeof detail.HTML === 'string' && detail.HTML.includes(marker), 'Message HTML contains the marker');
  check(typeof detail.Text === 'string' && detail.Text.includes(marker), 'Message Text contains the marker');
  check(detail.To?.[0]?.Address === address, 'Message To[0].Address equals the probe address');
}

try {
  await main();
} catch (error) {
  check(false, `Probe failed: ${errorMessage(error)}`);
}
process.exitCode = failures > 0 ? 1 : 0;
