import { describe, expect, it, vi } from 'vitest';
import { downloadCsv } from './download-csv';

describe('downloadCsv', () => {
  it('downloadCsv prefixes exactly one BOM whether or not the input had one, uses the filename and revokes the URL', async () => {
    const filename = 'ung-vien-12345678-20261014.csv';
    const csv = '"Tên ứng viên","Trạng thái"\r\n"Nguyễn An","Sàng lọc"\r\n';
    const url = 'blob:csv-export';
    const createObjectURL = vi.fn<(blob: Blob) => string>().mockReturnValue(url);
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const clickedAnchors: HTMLAnchorElement[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clickedAnchors.push(this);
    });

    for (const [index, input] of [csv, '\uFEFF' + csv].entries()) {
      downloadCsv(filename, input);

      expect(createObjectURL).toHaveBeenCalledTimes(index + 1);
      const blob = createObjectURL.mock.calls[index][0];
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/csv;charset=utf-8');
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          // Preserve the BOM while decoding so the assertion can detect duplicates.
          resolve(new TextDecoder('utf-8', { ignoreBOM: true }).decode(reader.result as ArrayBuffer));
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(blob);
      });
      expect(text).toBe('\uFEFF' + csv);
      expect(text.startsWith('\uFEFF\uFEFF')).toBe(false);
      expect(click).toHaveBeenCalledTimes(index + 1);
      expect(clickedAnchors[index].download).toBe(filename);
      expect(clickedAnchors[index].href).toBe(url);
      expect(revokeObjectURL).toHaveBeenNthCalledWith(index + 1, url);
      expect(revokeObjectURL).toHaveBeenCalledTimes(index + 1);
    }
  });
});
