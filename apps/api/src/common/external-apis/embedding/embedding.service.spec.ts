import { ConfigService } from '@nestjs/config';
import { AiActionType, AiLogStatus } from '@ats-platform/database';
import { OpenAI } from 'openai';
import { AiUsageLogsService } from '../../../app/ai-usage-logs/ai-usage-logs.service';
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  EmbeddingService,
} from './embedding.service';

const mockCreate = jest.fn();
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    embeddings: { create: mockCreate },
  })),
}));

describe('EmbeddingService', () => {
  let env: Record<string, string | undefined>;
  const usageLogs = { create: jest.fn() };

  const buildService = () =>
    new EmbeddingService(
      {
        getOrThrow: (key: string) => {
          if (env[key] === undefined) throw new Error(`missing ${key}`);
          return env[key];
        },
      } as unknown as ConfigService,
      usageLogs as unknown as AiUsageLogsService,
    );

  const embeddingFor = (value: number) =>
    new Array(EMBEDDING_DIMENSIONS).fill(value);

  beforeEach(() => {
    env = { OPENAI_API_KEY: 'sk-test' };
    (OpenAI as unknown as jest.Mock).mockClear();
    mockCreate.mockReset().mockImplementation(async ({ input }) => ({
      data: input.map((_: string, index: number) => ({
        index,
        embedding: embeddingFor(index),
      })),
      usage: { prompt_tokens: input.length * 3, total_tokens: input.length * 3 },
    }));
    usageLogs.create.mockReset().mockResolvedValue({});
  });

  it('pins the model and dimensions the schema depends on', () => {
    expect(EMBEDDING_MODEL).toBe('text-embedding-3-small');
    expect(EMBEDDING_DIMENSIONS).toBe(1536);
  });

  it('E3 embed([]) returns [] without calling the API or logging', async () => {
    const service = buildService();

    await expect(service.embed('ref-1', [])).resolves.toEqual([]);

    expect(OpenAI).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(usageLogs.create).not.toHaveBeenCalled();
  });

  it('sends the pinned model and dimensions, and creates the client with maxRetries 0', async () => {
    await buildService().embed('ref-1', ['React', 'NestJS']);

    expect(OpenAI).toHaveBeenCalledWith({
      apiKey: 'sk-test',
      maxRetries: 0,
      timeout: 120_000,
    });
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: ['React', 'NestJS'],
      dimensions: 1536,
      encoding_format: 'float',
    });
  });

  it('returns vectors in input order even when the API answers out of order', async () => {
    mockCreate.mockResolvedValue({
      data: [
        { index: 2, embedding: embeddingFor(2) },
        { index: 0, embedding: embeddingFor(0) },
        { index: 1, embedding: embeddingFor(1) },
      ],
      usage: { prompt_tokens: 9, total_tokens: 9 },
    });

    const result = await buildService().embed('ref-1', ['a', 'b', 'c']);

    expect(result.map((vector) => vector[0])).toEqual([0, 1, 2]);
    expect(result.every((vector) => vector.length === 1536)).toBe(true);
  });

  it('logs one embedding row per call, with prompt tokens and completionTokens 0', async () => {
    await buildService().embed('ref-1', ['a', 'b']);

    expect(usageLogs.create).toHaveBeenCalledTimes(1);
    expect(usageLogs.create).toHaveBeenCalledWith({
      refId: 'ref-1',
      actionType: AiActionType.embedding,
      model: 'text-embedding-3-small',
      promptTokenCount: 6,
      candidatesTokenCount: 0,
      duration: expect.any(Number),
      status: AiLogStatus.success,
      organizationId: null,
    });
  });

  it('records the organization when the caller knows it (GĐ4 R20)', async () => {
    await buildService().embed('scr-1', ['a'], 'org-7');

    expect(usageLogs.create).toHaveBeenCalledWith(expect.objectContaining({ refId: 'scr-1', organizationId: 'org-7' }));
  });

  it('splits more than 2048 texts into batches, one call and one log row each, keeping order', async () => {
    const texts = Array.from({ length: 2049 }, (_, i) => `t${i}`);
    mockCreate.mockImplementation(async ({ input }) => ({
      data: input.map((text: string, index: number) => ({
        index,
        embedding: embeddingFor(Number(text.slice(1))),
      })),
      usage: { prompt_tokens: input.length, total_tokens: input.length },
    }));

    const result = await buildService().embed(null, texts);

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockCreate.mock.calls[0][0].input).toHaveLength(2048);
    expect(mockCreate.mock.calls[1][0].input).toHaveLength(1);
    expect(usageLogs.create).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2049);
    expect(result[2048][0]).toBe(2048);
    expect(result[0][0]).toBe(0);
  });

  it('an API error is rethrown and logged as one failed row', async () => {
    const error = new Error('429 rate limited');
    mockCreate.mockRejectedValue(error);

    await expect(buildService().embed('ref-1', ['a'])).rejects.toBe(error);

    expect(usageLogs.create).toHaveBeenCalledTimes(1);
    expect(usageLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: AiActionType.embedding,
        promptTokenCount: 0,
        candidatesTokenCount: 0,
        status: AiLogStatus.failed,
      }),
    );
  });

  it('missing OPENAI_API_KEY throws an English error naming OPENAI_API_KEY, only when embedding is used', async () => {
    env = {};
    const service = buildService();

    await expect(service.embed('ref-1', ['a'])).rejects.toThrow(
      /OPENAI_API_KEY/,
    );

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('log failure does not fail the call', async () => {
    usageLogs.create.mockRejectedValue(new Error('db down'));

    await expect(buildService().embed('ref-1', ['a'])).resolves.toHaveLength(1);
    await new Promise((resolve) => setImmediate(resolve));
  });
});
