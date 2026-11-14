import type { ReactNode } from 'react';
import { getUiVariant } from '@/lib/ui-variant';
import { LegacyFrame } from '@/components/ui-variant/LegacyFrame';

export default async function AuthLayout({ children }: { children: ReactNode }) {
  if ((await getUiVariant()) === 'legacy') return <LegacyFrame>{children}</LegacyFrame>;

  return children;
}
