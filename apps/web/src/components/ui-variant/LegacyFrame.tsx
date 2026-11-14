import type { ReactNode } from 'react';
import { UseModernPill } from './UseModernPill';

export function LegacyFrame({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <UseModernPill />
    </>
  );
}
