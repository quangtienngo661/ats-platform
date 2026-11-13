import { statusTone, type Tone } from '@/lib/status-tones';

/** How a candidate sees an application's status: label and tone, both from `statusTone`. */
export const STATUS_CONFIG: Record<string, { label: string; tone: Tone }> = Object.fromEntries(
    ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'cancelled'].map((status) => [
        status,
        statusTone('candidate-application', status),
    ]),
);
