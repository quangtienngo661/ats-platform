/**
 * Reads what a candidate types into a salary field. Vietnamese writes thousands with a
 * dot ("15.000.000"); a comma or spaces are accepted too. Anything else is `'invalid'`
 * rather than guessed at: "1.5" would otherwise be read as 15, and a decimal salary
 * has no meaning in whole VND. An empty field is `null` (no filter).
 */
export function parseSalaryInput(text: string): number | null | 'invalid' {
    const compact = text.replace(/\s+/g, '');
    if (compact === '') return null;

    const grouped = /^\d{1,3}([.,])\d{3}(\1\d{3})*$/.test(compact);
    if (!grouped && !/^\d+$/.test(compact)) return 'invalid';

    const value = Number(compact.replace(/[.,]/g, ''));
    return Number.isSafeInteger(value) ? value : 'invalid';
}

/** 15000000 → "15.000.000", the way the salary fields show a value. */
export function formatSalaryInput(value: number): string {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
