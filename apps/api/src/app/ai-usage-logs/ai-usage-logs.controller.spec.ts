import { AiActionType, AiLogStatus } from '@ats-platform/database';
import { AiUsageLogsController } from './ai-usage-logs.controller';

describe('AiUsageLogsController', () => {
  it('parses pagination query values before delegating', async () => {
    const service = { getAllLogs: jest.fn(), getLogsById: jest.fn() };
    const controller = new AiUsageLogsController(service as any);

    await controller.getAllLogs(AiActionType.cv_parsing, AiLogStatus.success, '2', '25');

    expect(service.getAllLogs).toHaveBeenCalledWith(
      { actionType: AiActionType.cv_parsing, status: AiLogStatus.success },
      2,
      25,
    );
  });

  it('delegates lookup by reference id', async () => {
    const service = { getAllLogs: jest.fn(), getLogsById: jest.fn() };
    const controller = new AiUsageLogsController(service as any);

    await controller.getLogsById('ref-1');

    expect(service.getLogsById).toHaveBeenCalledWith('ref-1');
  });
});
