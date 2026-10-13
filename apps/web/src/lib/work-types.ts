/** How a job is worked — the values of a posting's `locationType`, and what the visitor sees. */
export const WORK_TYPES = ['remote', 'onsite', 'hybrid'] as const;

export type WorkType = (typeof WORK_TYPES)[number];

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
    remote: 'Remote',
    onsite: 'Văn phòng',
    hybrid: 'Hybrid',
};
