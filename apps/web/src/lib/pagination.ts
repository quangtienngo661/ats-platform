export function positivePage(value: unknown): number {
    if (typeof value !== 'string' || !/^\d+$/.test(value)) return 1;
    const page = Number(value);
    return Number.isSafeInteger(page) && page > 0 ? page : 1;
}
