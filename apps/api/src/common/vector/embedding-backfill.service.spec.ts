import {
  BACKFILL_BATCH_SIZE,
  EmbeddingBackfillService,
} from './embedding-backfill.service';

describe('EmbeddingBackfillService', () => {
  const vectorSearch = { findMissing: jest.fn() };
  const embeddingQueue = { enqueue: jest.fn() };
  let service: EmbeddingBackfillService;

  beforeEach(() => {
    jest.resetAllMocks();
    embeddingQueue.enqueue.mockResolvedValue(undefined);
    service = new EmbeddingBackfillService(
      vectorSearch as never,
      embeddingQueue as never,
    );
  });

  it('enqueues only rows with a null embedding, one job per row, and counts them', async () => {
    vectorSearch.findMissing.mockImplementation(async (target: string) =>
      target === 'skill' ? ['s1', 's2'] : ['p1'],
    );

    await expect(service.enqueueMissing()).resolves.toBe(3);

    expect(vectorSearch.findMissing).toHaveBeenCalledWith(
      'skill',
      BACKFILL_BATCH_SIZE,
    );
    expect(vectorSearch.findMissing).toHaveBeenCalledWith(
      'cv_parsed_data',
      BACKFILL_BATCH_SIZE,
    );
    expect(embeddingQueue.enqueue.mock.calls).toEqual([
      ['skill', 's1'],
      ['skill', 's2'],
      ['cv_parsed_data', 'p1'],
    ]);
  });

  it('second run after completion enqueues 0 and queues nothing', async () => {
    vectorSearch.findMissing.mockResolvedValue([]);

    await expect(service.enqueueMissing()).resolves.toBe(0);

    expect(embeddingQueue.enqueue).not.toHaveBeenCalled();
  });

  it('bounds one run to a batch per table, because every row costs one embedding call', () => {
    expect(BACKFILL_BATCH_SIZE).toBe(500);
  });

  it('a queue failure stops the run and reaches the caller (nothing is reported as enqueued)', async () => {
    vectorSearch.findMissing.mockResolvedValue(['s1']);
    embeddingQueue.enqueue.mockRejectedValue(new Error('redis down'));

    await expect(service.enqueueMissing()).rejects.toThrow('redis down');
  });
});
