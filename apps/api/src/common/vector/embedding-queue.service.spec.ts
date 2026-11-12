import { EmbeddingQueueService } from './embedding-queue.service';

describe('EmbeddingQueueService', () => {
  it('adds an "embed" job carrying the target and the id, with no per-queue job options', async () => {
    const queue = { add: jest.fn().mockResolvedValue(undefined) };
    const service = new EmbeddingQueueService(queue as never);

    await service.enqueue('skill', 'skill-1');

    // No options object: attempts and backoff come from BullModule.forRoot in app.module.ts.
    expect(queue.add).toHaveBeenCalledTimes(1);
    expect(queue.add).toHaveBeenCalledWith('embed', {
      target: 'skill',
      id: 'skill-1',
    });
  });

  it('lets a queue failure reach the caller (callers decide whether it matters)', async () => {
    const queue = {
      add: jest.fn().mockRejectedValue(new Error('redis down')),
    };
    const service = new EmbeddingQueueService(queue as never);

    await expect(service.enqueue('cv_parsed_data', 'p-1')).rejects.toThrow(
      'redis down',
    );
  });
});
