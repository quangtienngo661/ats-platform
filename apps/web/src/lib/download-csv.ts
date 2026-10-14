export function downloadCsv(filename: string, csv: string): void {
    const body = csv.startsWith('\uFEFF') ? csv.slice(1) : csv;
    const blob = new Blob(['\uFEFF' + body], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);

    try {
        anchor.click();
    } finally {
        anchor.remove();
        URL.revokeObjectURL(url);
    }
}
