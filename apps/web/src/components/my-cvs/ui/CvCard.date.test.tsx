// The upload time is rendered on the server (UTC in Docker) and again in the browser (Vietnam time).
// If the formatter follows the process time zone the two disagree and React discards the server HTML.
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ICvDto } from '@/types/interfaces/cv.interface';

const originalTz = process.env.TZ;

function cvUploadedAt(uploadedAt: string): ICvDto {
  return {
    cvId: 'cv-1', candidateId: 'candidate-1', fileName: 'cv.pdf', filePath: 'cvs/cv.pdf',
    parsingStatus: 'completed', uploadedAt, parsedData: null,
  };
}

/** Loads CvCard fresh under the given process time zone. */
async function renderCardUnder(tz: string, uploadedAt: string) {
  process.env.TZ = tz;
  vi.resetModules();
  const { CvCard } = await import('./CvCard');
  render(<CvCard cv={cvUploadedAt(uploadedAt)} onView={vi.fn()} onDelete={vi.fn()} />);
}

describe('CvCard upload time', () => {
  afterEach(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
    vi.resetModules();
  });

  it.each(['UTC', 'Asia/Ho_Chi_Minh', 'America/Los_Angeles'])(
    'shows 18:30 UTC on 13/11 as 01:30 14/11/2026 under TZ=%s',
    async (tz) => {
      await renderCardUnder(tz, '2026-11-13T18:30:00Z');
      expect(screen.getByText('Tải lên 01:30 14/11/2026')).toBeInTheDocument();
    },
  );

  it.each([
    ['2026-11-13T16:59:00Z', 'Tải lên 23:59 13/11/2026'],
    ['2026-11-13T17:00:00Z', 'Tải lên 00:00 14/11/2026'],
  ])('switches the day at Vietnam midnight: %s is %s', async (uploadedAt, expected) => {
    await renderCardUnder('UTC', uploadedAt);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
