import { cookies } from 'next/headers';

export type UiVariant = 'legacy' | 'modern';

export const UI_VARIANT_COOKIE = 'talentai-ui';

const isVariant = (value: string | undefined): value is UiVariant =>
  value === 'legacy' || value === 'modern';

// Cookie wins, then the deployment default; anything else is the new UI.
export function resolveUiVariant(cookieValue: string | undefined, envDefault: string | undefined): UiVariant {
  if (isVariant(cookieValue)) return cookieValue;
  if (isVariant(envDefault)) return envDefault;
  return 'modern';
}

// Server-only: reads request cookies. The `server-only` package is not installed, so no marker import.
export async function getUiVariant(): Promise<UiVariant> {
  const cookieStore = await cookies();
  return resolveUiVariant(cookieStore.get(UI_VARIANT_COOKIE)?.value, process.env.UI_DEFAULT_VARIANT);
}
