import { ParsingStatus } from '@ats-platform/database';
import { CvParsingProcessor } from './cv-parsing.processor';
import { createPrismaMock } from '../../../test-utils/unit-test-helpers';

describe('CvParsingProcessor — outcomes and retry boundary', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let processor: CvParsingProcessor;
  const gemini = { parseCV: jest.fn() };
  const parsed = { create: jest.fn() };
  const socket = { handleEmit: jest.fn() };
  const notifications = { create: jest.fn() };
  const job = (attemptsMade = 0) =>
    ({
      name: 'parse-cv',
      data: { cvId: 'cv-1' },
      attemptsMade,
      opts: { attempts: 3 },
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    prisma.$transaction.mockImplementation((callback: any) => callback(prisma));
    prisma.cV.findUnique.mockResolvedValue({
      rawText: 'CV text',
      fileName: 'CV.pdf',
      candidate: { userId: 'candidate-1' },
    });
    prisma.cV.update.mockImplementation(async ({ data }) => ({
      cvId: 'cv-1',
      fileName: 'CV.pdf',
      candidate: { userId: 'candidate-1' },
      ...data,
    }));
    processor = new CvParsingProcessor(
      parsed as any,
      gemini as any,
      prisma as any,
      socket as any,
      notifications as any,
    );
  });

  it('persists parsed data and completed state before notifying the owner', async () => {
    const data = { summary: 'Engineer', skills: ['TypeScript'] };
    gemini.parseCV.mockResolvedValue(data);

    await processor.process(job());

    expect(parsed.create).toHaveBeenCalledWith('cv-1', data, prisma);
    expect(prisma.cV.update).toHaveBeenLastCalledWith({
      where: { cvId: 'cv-1' },
      data: { parsingStatus: ParsingStatus.completed },
      include: { parsedData: true },
    });
    expect(socket.handleEmit).toHaveBeenCalledWith(
      'cvs:parsed_successfully',
      {
        cvId: 'cv-1',
        updatedCv: expect.objectContaining({ parsingStatus: 'completed' }),
      },
      'user_candidate-1',
    );
    expect(notifications.create).toHaveBeenCalledTimes(1);
  });

  it('does not announce terminal failure while automatic retries remain', async () => {
    const error = new Error('Temporary Gemini timeout');
    gemini.parseCV.mockRejectedValue(error);

    await expect(processor.process(job(0))).rejects.toBe(error);

    expect(
      prisma.cV.update.mock.calls.map(([args]) => args.data.parsingStatus),
    ).toEqual([ParsingStatus.processing]);
    expect(socket.handleEmit).not.toHaveBeenCalled();
    expect(notifications.create).not.toHaveBeenCalled();
  });

  it('records the final failure, notifies the owner and rejects the queue job', async () => {
    const error = new Error('Gemini unavailable');
    gemini.parseCV.mockRejectedValue(error);

    await expect(processor.process(job(2))).rejects.toBe(error);

    expect(prisma.cV.update).toHaveBeenLastCalledWith({
      where: { cvId: 'cv-1' },
      data: {
        parsingStatus: ParsingStatus.failed,
        errorLog: 'Gemini unavailable',
      },
      include: { candidate: { select: { userId: true } } },
    });
    expect(notifications.create).toHaveBeenCalledTimes(1);
    expect(socket.handleEmit).toHaveBeenCalledWith(
      'cvs:parsed_successfully',
      {
        cvId: 'cv-1',
        updatedCv: expect.objectContaining({ parsingStatus: 'failed' }),
      },
      'user_candidate-1',
    );
  });

  it('ignores an unrelated queue job', async () => {
    await processor.process({ ...job(), name: 'unknown-job' });
    expect(gemini.parseCV).not.toHaveBeenCalled();
    expect(prisma.cV.update).not.toHaveBeenCalled();
  });

  it('announces failure immediately when the queue job has no automatic retries', async () => {
    const error = new Error('Invalid CV');
    gemini.parseCV.mockRejectedValue(error);
    await expect(processor.process({ ...job(), opts: {} })).rejects.toBe(error);
    expect(prisma.cV.update).toHaveBeenLastCalledWith(expect.objectContaining({
      data: { parsingStatus: ParsingStatus.failed, errorLog: 'Invalid CV' },
    }));
    expect(notifications.create).toHaveBeenCalledTimes(1);
  });

  it('only announces completion when a transient error succeeds on the next attempt', async () => {
    gemini.parseCV.mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce({ skills: ['TypeScript'] });
    await expect(processor.process(job(0))).rejects.toThrow('temporary');
    await processor.process(job(1));
    expect(prisma.cV.update.mock.calls.map(([args]) => args.data.parsingStatus)).toEqual([
      ParsingStatus.processing, ParsingStatus.processing, ParsingStatus.completed,
    ]);
    expect(notifications.create).toHaveBeenCalledTimes(1);
    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Phân tích CV hoàn tất',
    }));
  });
});
