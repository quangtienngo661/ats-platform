import { ConfigService } from '@nestjs/config';
import { AiActionType } from '@ats-platform/database';
import { OpenAI } from 'openai';
import { OpenAiClient } from './openai.client';
import { LlmRequest } from './llm.types';

const mockCreate = jest.fn();
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    responses: { create: mockCreate },
  })),
}));

describe('OpenAiClient', () => {
  let env: Record<string, string | undefined>;

  const buildConfig = () =>
    ({
      get: jest.fn((key: string) => env[key]),
      getOrThrow: jest.fn((key: string) => {
        if (env[key] === undefined) throw new Error(`missing ${key}`);
        return env[key];
      }),
    }) as unknown as ConfigService;

  const buildRequest = (overrides: Partial<LlmRequest> = {}): LlmRequest => ({
    refId: 'ref-1',
    actionType: AiActionType.cv_scoring,
    tier: 'pro',
    reasoning: 'high',
    systemPrompt: 'SYSTEM PROMPT',
    content: 'USER CONTENT',
    signal: new AbortController().signal,
    ...overrides,
  });

  beforeEach(() => {
    env = { OPENAI_API_KEY: 'sk-test' };
    (OpenAI as unknown as jest.Mock).mockClear();
    mockCreate.mockReset().mockResolvedValue({
      output_text: '{"ok":true}',
      usage: {
        input_tokens: 1,
        output_tokens: 2,
        output_tokens_details: { reasoning_tokens: 0 },
      },
    });
  });

  it('creates the client with maxRetries 0', () => {
    new OpenAiClient(buildConfig());

    expect(OpenAI).toHaveBeenCalledWith({
      apiKey: 'sk-test',
      maxRetries: 0,
    });
  });

  it('sends model per tier, instructions = systemPrompt, input = content, text.format json_object, reasoning effort = req.reasoning, signal', async () => {
    const client = new OpenAiClient(buildConfig());
    const signal = new AbortController().signal;

    const pro = await client.generateJson(
      buildRequest({ tier: 'pro', reasoning: 'high', signal }),
    );
    const flash = await client.generateJson(
      buildRequest({ tier: 'flash', reasoning: 'medium', signal }),
    );

    expect(mockCreate).toHaveBeenNthCalledWith(
      1,
      {
        model: 'gpt-6.1-sol',
        instructions: 'SYSTEM PROMPT',
        input: 'USER CONTENT',
        text: { format: { type: 'json_object' } },
        reasoning: { effort: 'high' },
      },
      { signal },
    );
    expect(mockCreate).toHaveBeenNthCalledWith(
      2,
      {
        model: 'gpt-6-luna',
        instructions: 'SYSTEM PROMPT',
        input: 'USER CONTENT',
        text: { format: { type: 'json_object' } },
        reasoning: { effort: 'medium' },
      },
      { signal },
    );
    expect(pro.model).toBe('gpt-6.1-sol');
    expect(flash.model).toBe('gpt-6-luna');
  });

  it('model env overrides', async () => {
    env.OPENAI_MODEL_PRO = 'custom-pro';
    env.OPENAI_MODEL_FLASH = 'custom-flash';
    const client = new OpenAiClient(buildConfig());

    const pro = await client.generateJson(buildRequest({ tier: 'pro' }));
    const flash = await client.generateJson(buildRequest({ tier: 'flash' }));

    expect(mockCreate.mock.calls[0][0].model).toBe('custom-pro');
    expect(mockCreate.mock.calls[1][0].model).toBe('custom-flash');
    expect(pro.model).toBe('custom-pro');
    expect(flash.model).toBe('custom-flash');
  });

  it('returns the raw output_text without parsing it', async () => {
    mockCreate.mockResolvedValue({ output_text: 'not json', usage: {} });
    const client = new OpenAiClient(buildConfig());

    const result = await client.generateJson(buildRequest());

    expect(result.text).toBe('not json');
  });

  it('reads input/output tokens from usage; output_tokens already includes reasoning tokens, so they are not added again', async () => {
    mockCreate.mockResolvedValue({
      output_text: '{}',
      usage: {
        input_tokens: 200,
        output_tokens: 60,
        output_tokens_details: { reasoning_tokens: 40 },
      },
    });
    const client = new OpenAiClient(buildConfig());

    const result = await client.generateJson(buildRequest());

    expect(result.promptTokens).toBe(200);
    expect(result.outputTokens).toBe(60);
  });

  it('reports zero tokens when usage is missing', async () => {
    mockCreate.mockResolvedValue({ output_text: '{}' });
    const client = new OpenAiClient(buildConfig());

    const result = await client.generateJson(buildRequest());

    expect(result.promptTokens).toBe(0);
    expect(result.outputTokens).toBe(0);
  });
});
