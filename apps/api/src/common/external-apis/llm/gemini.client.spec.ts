import { ConfigService } from '@nestjs/config';
import { ThinkingLevel } from '@google/genai';
import { AiActionType } from '@ats-platform/database';
import { GeminiClient } from './gemini.client';
import { LlmRequest } from './llm.types';

const mockGenerateContent = jest.fn();
jest.mock('@google/genai', () => ({
  ...jest.requireActual('@google/genai'),
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}));

describe('GeminiClient', () => {
  const configService = {
    getOrThrow: jest.fn().mockReturnValue('test-api-key'),
  } as unknown as ConfigService;
  let client: GeminiClient;

  const buildRequest = (overrides: Partial<LlmRequest> = {}): LlmRequest => ({
    refId: 'ref-1',
    actionType: AiActionType.cv_parsing,
    tier: 'flash',
    reasoning: 'medium',
    systemPrompt: 'SYSTEM PROMPT',
    content: 'USER CONTENT',
    signal: new AbortController().signal,
    ...overrides,
  });

  beforeEach(() => {
    mockGenerateContent.mockReset().mockResolvedValue({
      text: '{"ok":true}',
      usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 2 },
    });
    client = new GeminiClient(configService);
  });

  it('uses gemini-3.1-pro-preview for pro and gemini-3.5-flash for flash', async () => {
    const pro = await client.generateJson(buildRequest({ tier: 'pro' }));
    const flash = await client.generateJson(buildRequest({ tier: 'flash' }));

    expect(mockGenerateContent.mock.calls[0][0].model).toBe(
      'gemini-3.1-pro-preview',
    );
    expect(mockGenerateContent.mock.calls[1][0].model).toBe(
      'gemini-3.5-flash',
    );
    expect(pro.model).toBe('gemini-3.1-pro-preview');
    expect(flash.model).toBe('gemini-3.5-flash');
  });

  it('maps medium/high to ThinkingLevel.MEDIUM/HIGH and sets responseMimeType application/json and systemInstruction', async () => {
    const signal = new AbortController().signal;

    await client.generateJson(buildRequest({ reasoning: 'medium', signal }));
    await client.generateJson(buildRequest({ reasoning: 'high', signal }));

    const [medium, high] = mockGenerateContent.mock.calls.map((c) => c[0]);
    expect(medium.config.thinkingConfig).toEqual({
      thinkingLevel: ThinkingLevel.MEDIUM,
    });
    expect(high.config.thinkingConfig).toEqual({
      thinkingLevel: ThinkingLevel.HIGH,
    });
    expect(medium.config.responseMimeType).toBe('application/json');
    expect(medium.config.systemInstruction).toBe('SYSTEM PROMPT');
    expect(medium.contents).toBe('USER CONTENT');
    expect(medium.config.abortSignal).toBe(signal);
  });

  it('returns the raw response text without parsing it', async () => {
    mockGenerateContent.mockResolvedValue({
      text: 'not json at all',
      usageMetadata: {},
    });

    const result = await client.generateJson(buildRequest());

    expect(result.text).toBe('not json at all');
  });

  it('outputTokens = candidatesTokenCount + thoughtsTokenCount', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '{}',
      usageMetadata: {
        promptTokenCount: 120,
        candidatesTokenCount: 40,
        thoughtsTokenCount: 15,
      },
    });

    const withThoughts = await client.generateJson(buildRequest());

    expect(withThoughts.promptTokens).toBe(120);
    expect(withThoughts.outputTokens).toBe(55);

    mockGenerateContent.mockResolvedValue({
      text: '{}',
      usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 40 },
    });

    const withoutThoughts = await client.generateJson(buildRequest());

    expect(withoutThoughts.promptTokens).toBe(120);
    expect(withoutThoughts.outputTokens).toBe(40);
  });

  it('reports zero tokens when usageMetadata is missing', async () => {
    mockGenerateContent.mockResolvedValue({ text: '{}' });

    const result = await client.generateJson(buildRequest());

    expect(result.promptTokens).toBe(0);
    expect(result.outputTokens).toBe(0);
  });

  it('modelFor names the model each tier uses', () => {
    expect(client.modelFor('pro')).toBe('gemini-3.1-pro-preview');
    expect(client.modelFor('flash')).toBe('gemini-3.5-flash');
  });

  it('reads the key from GOOGLE_API_KEY', () => {
    expect(configService.getOrThrow).toHaveBeenCalledWith('GOOGLE_API_KEY');
  });
});
