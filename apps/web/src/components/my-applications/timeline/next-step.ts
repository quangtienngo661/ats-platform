import { TIMELINE_LABELS } from './build-timeline';

const PIPELINE = ['applied', 'screening', 'interview', 'offer', 'hired'];

/** The label of the step after `status` in the hiring pipeline, or null once the application is closed. */
export function nextStepLabel(status: string): string | null {
    const index = PIPELINE.indexOf(status);
    if (index < 0 || index === PIPELINE.length - 1) return null;
    return TIMELINE_LABELS[PIPELINE[index + 1]];
}

/** In progress = still moving through the pipeline; the rest (hired, rejected, withdrawn) is finished. */
export function isInProgress(status: string): boolean {
    const index = PIPELINE.indexOf(status);
    return index >= 0 && index < PIPELINE.length - 1;
}
