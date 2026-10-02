import { unstable_rethrow } from 'next/navigation';

type ApiError = { response?: { status?: number; headers?: { location?: string }; data?: { message?: unknown } } };

export function apiErrorResponse(error: unknown): ApiError['response'] {
    if (error && typeof error === 'object' && 'response' in error) {
        return (error as ApiError).response;
    }
    return undefined;
}

/** Preserve Next.js redirects/notFound before translating an API error for a form. */
export function actionErrorMessage(error: unknown, fallback = 'Có lỗi xảy ra'): string {
    unstable_rethrow(error);
    const message = apiErrorResponse(error)?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message)) {
        const first = message.find((item): item is string => typeof item === 'string' && Boolean(item.trim()));
        if (first) return first;
    }
    return fallback;
}

export function isMissingResource(error: unknown): boolean {
    unstable_rethrow(error);
    return apiErrorResponse(error)?.status === 404;
}

/** Failed reads must reach a route error boundary instead of becoming empty data. */
export function rethrowReadError(error: unknown, fallback: string): never {
    unstable_rethrow(error);
    throw new Error(fallback, { cause: error });
}
