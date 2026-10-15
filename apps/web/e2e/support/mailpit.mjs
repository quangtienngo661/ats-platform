import { setTimeout as delay } from 'node:timers/promises';

export function mailpitUrl() {
  const url = new URL(process.env.WEB_E2E_MAILPIT_URL ?? 'http://127.0.0.1:58025');
  if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
    throw new Error('E2E mail must use the local test stack Mailpit.');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Mailpit must use HTTP or HTTPS.');
  }
  return url.toString().replace(/\/+$/, '');
}

async function getJson(url, timeoutMs = 5_000) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    redirect: 'error',
  });
  if (!response.ok) throw new Error(`GET ${url} returned HTTP ${response.status}`);
  return response.json();
}

export async function waitForMessagesTo(address, count, timeoutMs = 30_000) {
  const url = `${mailpitUrl()}/api/v1/search?query=${encodeURIComponent(`to:"${address}"`)}`;
  const deadline = Date.now() + timeoutMs;
  let messages = [];
  while (Date.now() < deadline) {
    let result;
    try {
      result = await getJson(url, Math.max(1, deadline - Date.now()));
    } catch (error) {
      if (Date.now() >= deadline) break;
      throw error;
    }
    if (!Array.isArray(result.messages)) {
      throw new Error('Mailpit search response is missing the messages array');
    }
    messages = result.messages;
    if (messages.length >= count) return messages;
    const remaining = deadline - Date.now();
    if (remaining > 0) await delay(Math.min(500, remaining));
  }
  throw new Error(`Timed out waiting for ${count} messages to ${address}; saw ${messages.length}.`);
}

export async function readMessage(id) {
  const { Subject, HTML, Text, To } = await getJson(`${mailpitUrl()}/api/v1/message/${encodeURIComponent(id)}`);
  return { Subject, HTML, Text, To };
}
