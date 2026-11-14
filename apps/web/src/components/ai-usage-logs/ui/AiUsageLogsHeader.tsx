import type { ReactNode } from 'react';
import { PageToolbar } from '@/components/ui';

/** The page title with the filters beside it. */
export function AiUsageLogsHeader({ children }: { children?: ReactNode }) {
    return <PageToolbar title="AI Usage Logs">{children}</PageToolbar>;
}
