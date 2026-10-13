const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;
const ABSOLUTE_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Turns a date and time picked in a form into an absolute UTC instant, read in the
 * timezone of the runtime that calls it. Call it in the browser, never on the server:
 * only the browser knows which timezone the person typed the time in.
 */
export function localDateTimeToIso(date: string, time: string): string | null {
    const dateParts = DATE_PATTERN.exec(date);
    const timeParts = TIME_PATTERN.exec(time);
    if (!dateParts || !timeParts) return null;

    const [year, month, day] = dateParts.slice(1).map(Number);
    const [hours, minutes] = timeParts.slice(1).map(Number);
    const local = new Date(year, month - 1, day, hours, minutes);

    // The Date constructor rolls invalid values over (month 13 → next year); reject those.
    const rolledOver =
        local.getFullYear() !== year ||
        local.getMonth() !== month - 1 ||
        local.getDate() !== day ||
        local.getHours() !== hours ||
        local.getMinutes() !== minutes;
    return rolledOver ? null : local.toISOString();
}

/** True for an ISO date-time that names its offset (`Z` or `±hh:mm`), so no timezone has to be guessed. */
export function isAbsoluteIso(value: string): boolean {
    return ABSOLUTE_ISO_PATTERN.test(value) && !Number.isNaN(Date.parse(value));
}
