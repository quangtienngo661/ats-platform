// Own the web process so an existing localhost Next app cannot call a production API.
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { apiBaseUrl, localTestUrl } from './local-target.ts';

const apiUrl = apiBaseUrl();
const webUrl = new URL(
  localTestUrl(process.env.WEB_E2E_BASE_URL ?? 'http://localhost:3000'),
);
if (webUrl.protocol !== 'http:' || webUrl.pathname !== '/') {
  throw new Error('Web E2E cần HTTP localhost tại đường dẫn gốc.');
}
try {
  const response = await fetch(`${apiUrl}/health`, {
    signal: AbortSignal.timeout(3_000),
  });
  if (!response.ok) throw new Error('health unavailable');
  const body = await response.json();
  if ((body.data ?? body).status !== 'up')
    throw new Error('dependencies unavailable');
} catch {
  throw new Error(
    `Chưa thể chạy E2E: API/database/Redis local chưa sẵn sàng tại ${apiUrl}/health.`,
  );
}
for (const key of [
  'WEB_E2E_ADMIN_EMAIL',
  'WEB_E2E_ADMIN_PASSWORD',
  'WEB_E2E_ORGANIZATION_ID',
  'WEB_E2E_CANDIDATE_EMAIL',
  'WEB_E2E_CANDIDATE_PASSWORD',
]) {
  if (!process.env[key])
    throw new Error(
      `Thiếu ${key}; dùng tài khoản và tổ chức trong database test.`,
    );
}

const child = spawn(
  process.execPath,
  [
    resolve('node_modules/next/dist/bin/next'),
    'dev',
    'apps/web',
    '--hostname',
    webUrl.hostname,
    '--port',
    webUrl.port || '3000',
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      NEXT_PUBLIC_API_BASE_URL: apiUrl,
      NEXT_PUBLIC_SOCKET_URL: new URL(apiUrl).origin,
    },
  },
);
child.on('error', (error) => {
  throw error;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
