export function toCsv(
  headers: readonly string[],
  rows: readonly (readonly (string | number | null | undefined)[])[],
): string {
  const records = [headers, ...rows].map((record) => {
    const cells = record.map((value) => {
      let cell = value === null || value === undefined ? '' : String(value);

      // OWASP CSV Injection recommends a tab prefix inside quoted fields: https://community.owasp.org/attacks/CSV_Injection
      if (/^[-=+@\t\r\n]/.test(cell)) {
        cell = `\t${cell}`;
      }

      return `"${cell.replace(/"/g, '""')}"`;
    });

    return `${cells.join(',')}\r\n`;
  });

  return `\uFEFF${records.join('')}`;
}
