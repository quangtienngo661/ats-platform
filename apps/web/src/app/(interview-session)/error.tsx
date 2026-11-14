'use client';

import RouteError, { type RouteErrorProps } from '@/components/common/RouteError';

export default function InterviewError(props: Omit<RouteErrorProps, 'tone'>) {
    return <RouteError {...props} tone="night" />;
}
