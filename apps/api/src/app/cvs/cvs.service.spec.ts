import { ForbiddenException } from '@nestjs/common';
import { ParsingStatus } from '@ats-platform/database';
import * as fs from 'fs/promises';
import { CVsService } from './cvs.service';
import { createPrismaMock, createQueueMock } from '../../test-utils/unit-test-helpers';

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  unlink: jest.fn(),
}));

describe('CVsService', () => {
  let service: CVsService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let candidatesService: { updateProfileData: jest.Mock };
  let pdfService: { parsePdf: jest.Mock };
  let queue: ReturnType<typeof createQueueMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    candidatesService = { updateProfileData: jest.fn() };
    pdfService = { parsePdf: jest.fn() };
    queue = createQueueMock();
    service = new CVsService(prisma as any, candidatesService as any, pdfService as any, queue as any);
    (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('pdf'));
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);
  });

  it('uploads a CV, extracts text, stores a relative path, and queues parsing', async () => {
    pdfService.parsePdf.mockResolvedValue('raw text');
    prisma.cV.create.mockResolvedValue({ cvId: 'cv-1', filePath: 'uploads/cv.pdf' });

    await service.uploadCV('cand-1', { path: `${process.cwd()}\\uploads\\cv.pdf` } as any, 'cv.pdf');

    expect(prisma.cV.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          candidateId: 'cand-1',
          fileName: 'cv.pdf',
          filePath: 'uploads/cv.pdf',
          parsingStatus: ParsingStatus.pending,
          rawText: 'raw text',
        }),
      }),
    );
    expect(queue.add).toHaveBeenCalledWith('parse-cv', { cvId: 'cv-1' });
  });

  it('returns parsed data or throws when it is missing', async () => {
    prisma.cV.findUnique.mockResolvedValueOnce({ cvId: 'cv-1', parsedData: { summary: 'ok' } });
    await expect(service.getParsedData('cv-1')).resolves.toEqual({ summary: 'ok' });

    prisma.cV.findUnique.mockResolvedValueOnce({ cvId: 'cv-2', parsedData: null });
    await expect(service.getParsedData('cv-2')).rejects.toThrow('d');
  });

  it('confirms and syncs a completed parsed CV', async () => {
    prisma.cV.findUnique.mockResolvedValue({
      cvId: 'cv-1',
      parsingStatus: ParsingStatus.completed,
      parsedData: {
        isConfirmed: false,
        summary: 'Summary',
        location: 'HCM',
        experience: [],
        education: [],
        skills: ['nestjs'],
      },
    });
    prisma.cVParsedData.update.mockResolvedValue({ cvId: 'cv-1', isConfirmed: true });

    await expect(service.confirmCV('cv-1', 'cand-1', true, true)).resolves.toEqual(
      expect.objectContaining({ cvId: 'cv-1', isConfirmed: true }),
    );

    expect(candidatesService.updateProfileData).toHaveBeenCalledWith(
      'cand-1',
      expect.objectContaining({ summary: 'Summary', source_cv_id: 'cv-1' }),
    );
    expect(prisma.cVParsedData.update).toHaveBeenCalledWith({
      where: { cvId: 'cv-1' },
      data: { isConfirmed: true },
    });
  });

  it('rejects delete when the CV is owned by another candidate or in use', async () => {
    prisma.cV.findUnique.mockResolvedValue({ cvId: 'cv-1', candidateId: 'other', _count: { applications: 0 } });
    await expect(service.deleteCV('cv-1', 'cand-1')).rejects.toBeInstanceOf(ForbiddenException);

    prisma.cV.findUnique.mockResolvedValue({ cvId: 'cv-1', candidateId: 'cand-1', _count: { applications: 1 } });
    await expect(service.deleteCV('cv-1', 'cand-1')).rejects.toThrow('d');
  });

  it('deletes the DB row and ignores missing files', async () => {
    prisma.cV.findUnique.mockResolvedValue({ cvId: 'cv-1', candidateId: 'cand-1', filePath: 'uploads/missing.pdf', _count: { applications: 0 } });
    prisma.cV.delete.mockResolvedValue({ cvId: 'cv-1' });
    (fs.unlink as jest.Mock).mockRejectedValue({ code: 'ENOENT' });

    await expect(service.deleteCV('cv-1', 'cand-1')).resolves.toEqual({ message: expect.any(String) });
  });
});
