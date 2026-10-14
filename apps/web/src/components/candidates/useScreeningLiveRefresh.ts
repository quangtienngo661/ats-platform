'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocketStore } from '@/stores/useSocketStore';

export function useScreeningLiveRefresh(): void {
    const router = useRouter();
    const { status, onEvent, offEvent } = useSocketStore();

    useEffect(() => {
        if (status !== 'connected') return;

        let timer: ReturnType<typeof setTimeout> | undefined;
        const handler = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                timer = undefined;
                router.refresh();
            }, 1000);
        };

        onEvent('cv-screening:completed', handler);

        return () => {
            offEvent('cv-screening:completed', handler);
            clearTimeout(timer);
        };
    }, [status, onEvent, offEvent, router]);
}
