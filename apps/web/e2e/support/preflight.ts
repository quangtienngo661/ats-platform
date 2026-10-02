import type { FullConfig } from '@playwright/test';
import { apiBaseUrl } from './local-target';

export default async function preflight(config: FullConfig) {
  const apiUrl = apiBaseUrl();
  try {
    const response = await fetch(`${apiUrl}/health`, {
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) throw new Error(`health HTTP ${response.status}`);
    const body = await response.json();
    if ((body.data ?? body).status !== 'up')
      throw new Error('database/Redis chưa sẵn sàng');
  } catch {
    throw new Error(
      `Chưa thể chạy E2E: API/database/Redis local chưa sẵn sàng tại ${apiUrl}/health. Xem docs/tasks/test-coverage-audit/README.md.`,
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
        `Thiếu ${key}; xem fixture local trong docs/tasks/test-defect-fixes/README.md.`,
      );
  }
  const webUrl = config.projects[0].use.baseURL!;
  try {
    const response = await fetch(`${webUrl}/sign-in/admin`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error('web unavailable');
  } catch {
    throw new Error(
      `Chưa thể chạy E2E: frontend local chưa sẵn sàng tại ${webUrl}.`,
    );
  }
}
