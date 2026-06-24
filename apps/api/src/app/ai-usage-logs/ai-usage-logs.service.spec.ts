import { Logger } from '@nestjs/common';
import { AiActionType, AiLogStatus } from '@ats-platform/database';
import { AiUsageLogsService } from './ai-usage-logs.service';
import { createPrismaMock } from '../../test-utils/unit-test-helpers';

describe('AiUsageLogsService', () => {
  let service: AiUsageLogsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new AiUsageLogsService(prisma as any);
  });

  it('creates an AI usage log', async () => {
    prisma.aiUsageLog.create.mockResolvedValue({ logId: 'log-1' });

    await service.create({
      refId: 'ref-1',
      actionType: AiActionType.cv_parsing,
      model: 'gemini',
      promptTokenCount: 10,
      candidatesTokenCount: 5,
      duration: 123,
      status: AiLogStatus.success,
    });

    expect(prisma.aiUsageLog.create).toHaveBeenCalledWith({
      data: {
        referenceId: 'ref-1',
        actionType: AiActionType.cv_parsing,
        modelName: 'gemini',
        promptTokens: 10,
        completionTokens: 5,
        durationMs: 123,
        status: AiLogStatus.success,
      },
    });
  });

  it('logs and swallows create failures', async () => {
    const spy = jest.spyOn(Logger, 'error').mockImplementation();
    prisma.aiUsageLog.create.mockRejectedValue(new Error('db down'));

    await expect(
      service.create({
        refId: 'ref-1',
        actionType: AiActionType.cv_parsing,
        model: 'gemini',
        promptTokenCount: 10,
        candidatesTokenCount: 5,
        duration: 123,
        status: AiLogStatus.failed,
      }),
    ).resolves.toBeUndefined();

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('throws when a reference has no logs', async () => {
    prisma.aiUsageLog.findMany.mockResolvedValue([]);

    await expect(service.getLogsById('ref-1')).rejects.toThrow('reference ID');
  });

  it('returns filtered paginated logs', async () => {
    prisma.aiUsageLog.findMany.mockResolvedValue([{ logId: 'log-1' }]);
    prisma.aiUsageLog.count.mockResolvedValue(21);

    await expect(
      service.getAllLogs({ actionType: AiActionType.job_parsing, status: AiLogStatus.success }, 2, 10),
    ).resolves.toEqual({
      items: [{ logId: 'log-1' }],
      pagination: { page: 2, limit: 10, total: 21, totalPages: 3 },
    });

    expect(prisma.aiUsageLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { actionType: AiActionType.job_parsing, status: AiLogStatus.success },
        skip: 10,
        take: 10,
      }),
    );
  });
});
