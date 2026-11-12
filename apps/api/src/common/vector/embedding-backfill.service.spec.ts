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
    const missing: Record<string, string[]> = {
      skill: ['s1', 's2'],
      cv_parsed_data: ['p1'],
      interview_question: ['q1'],
    };
    vectorSearch.findMissing.mockImplementation(
      async (target: string) => missing[target],
    );

    await expect(service.enqueueMissing()).resolves.toBe(4);

    for (const target of Object.keys(missing)) {
      expect(vectorSearch.findMissing).toHaveBeenCalledWith(
        target,
        BACKFILL_BATCH_SIZE,
      );
    }
    expect(vectorSearch.findMissing).toHaveBeenCalledTimes(3);
    expect(embeddingQueue.enqueue.mock.calls).toEqual([
      ['skill', 's1'],
      ['skill', 's2'],
      ['cv_parsed_data', 'p1'],
      ['interview_question', 'q1'],
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
