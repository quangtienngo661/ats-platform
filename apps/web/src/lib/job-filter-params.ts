const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_SKILLS = 20;

type Param = string | string[] | undefined;

export interface JobFilterParams {
    salaryMin?: number;
    salaryMax?: number;
    skillIds?: string[];
}

function wholeNumber(value: Param): number | undefined {
    if (typeof value !== 'string' || !/^\d+$/.test(value)) return undefined;
    const number = Number(value);
    return Number.isSafeInteger(number) ? number : undefined;
}

/**
 * What the job search takes from the URL. A value the API would answer 400 to is
 * dropped here instead, so a hand-edited or stale link still opens the page: salaries
 * must be whole numbers (a minimum above the maximum drops both), skill ids must be
 * UUIDs, no repeats, no more than the API's 20.
 */
export function parseJobFilterParams(params: { salaryMin?: Param; salaryMax?: Param; skillIds?: Param }): JobFilterParams {
    let salaryMin = wholeNumber(params.salaryMin);
    let salaryMax = wholeNumber(params.salaryMax);
    if (salaryMin !== undefined && salaryMax !== undefined && salaryMin > salaryMax) {
        salaryMin = undefined;
        salaryMax = undefined;
    }

    const ids = [...new Set([params.skillIds ?? []].flat().filter((id) => UUID.test(id)))].slice(0, MAX_SKILLS);

    return {
        ...(salaryMin !== undefined ? { salaryMin } : {}),
        ...(salaryMax !== undefined ? { salaryMax } : {}),
        ...(ids.length ? { skillIds: ids } : {}),
    };
}
