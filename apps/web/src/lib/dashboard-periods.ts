/**
 * The periods the dashboard offers, in days. A plain module: the server page and the client
 * filter both read it, and a value exported from a 'use client' file reaches a server component
 * only as a client reference, not as the array.
 */
export const DASHBOARD_PERIODS = [7, 30, 90] as const;
export const DEFAULT_DASHBOARD_PERIOD = 30;

export function dashboardPeriod(value: string | undefined): number {
    const days = Number(value);
    return (DASHBOARD_PERIODS as readonly number[]).includes(days) ? days : DEFAULT_DASHBOARD_PERIOD;
}
