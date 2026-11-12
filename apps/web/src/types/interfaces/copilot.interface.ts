/** One AI co-pilot suggestion for an application (GET /applications/job/:jobId/copilot). */
export interface ICopilotSuggestion {
    ruleId: string;
    /** Sent back to apply or dismiss; the API refuses a stale one. */
    key: string;
    title: string;
    reasons: string[];
    action:
        | { type: 'move_status'; to: 'screening' | 'interview' | 'offer' }
        | { type: 'run_screening' }
        | { type: 'schedule_interview' }
        | { type: 'open_profile' };
}
