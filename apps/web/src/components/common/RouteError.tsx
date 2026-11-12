'use client';

import { CloudOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/components/ui/cn';

export interface RouteErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
    /** `night` is for the mock interview's dark shell. */
    tone?: 'canvas' | 'night';
}

/**
 * The fallback of every route group's `error.tsx`. "Thử lại" refetches the server data (`router.refresh`) and
 * re-renders the boundary (`reset`) in one transition, so the button shows its spinner until both are done.
 */
export default function RouteError({ reset, tone = 'canvas' }: RouteErrorProps) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const night = tone === 'night';
    return (
        <div role="alert" className="flex min-h-[60dvh] items-center justify-center px-4 py-16">
            <div className="flex max-w-sm flex-col items-center text-center">
                <span
                    className={cn(
                        'mb-4 flex size-10 items-center justify-center rounded-card',
                        night ? 'bg-night-3 text-night-ink-3' : 'bg-surface-2 text-ink-3',
                    )}
                >
                    <CloudOff size={20} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <h1 className={cn('text-title-sm', night ? 'text-night-ink' : 'text-ink')}>Không tải được dữ liệu.</h1>
                <p className={cn('mt-1 text-body-sm', night ? 'text-night-ink-3' : 'text-ink-3')}>
                    Kiểm tra kết nối mạng rồi thử lại.
                </p>
                <Button
                    // On the night surface the light button is the primary one.
                    variant={night ? 'secondary' : 'primary'}
                    loading={pending}
                    onClick={() =>
                        startTransition(() => {
                            router.refresh();
                            reset();
                        })
                    }
                    className="mt-5"
                >
                    Thử lại
                </Button>
            </div>
        </div>
    );
}
