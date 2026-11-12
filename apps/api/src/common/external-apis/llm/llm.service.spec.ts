import { ConfigService } from '@nestjs/config';
import { AiActionType, AiLogStatus } from '@ats-platform/database';
import { AiUsageLogsService } from '../../../app/ai-usage-logs/ai-usage-logs.service';
import {
  CV_PARSING_PROMPT,
  CV_SCREENING_PROMPT,
  JD_PARSING_PROMPT,
  MOCK_INTERVIEW_EVALUATE_PROMPT,
  MOCK_INTERVIEW_FOLLOWUP_PROMPT,
  MOCK_INTERVIEW_GENERATE_PROMPT,
  MOCK_INTERVIEW_RESULT_PROMPT,
} from '../../constants/gemini-api';
import { GeminiClient } from './gemini.client';
import { LlmClient, LlmRequest, LlmTier } from './llm.types';
import { LlmService } from './llm.service';
import { createLlmClient } from './llm.module';
import { OpenAiClient } from './openai.client';

jest.mock('@google/genai', () => ({
  ...jest.requireActual('@google/genai'),
  GoogleGenAI: jest.fn().mockImplementation(() => ({ models: {} })),
}));
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({ responses: {} })),
}));

const MODELS: Record<LlmTier, string> = { pro: 'model-pro', flash: 'model-flash' };

describe('LlmService', () => {
  let service: LlmService;
  const client = {
    generateJson: jest.fn(),
    modelFor: jest.fn((tier: LlmTier) => MODELS[tier]),
  };
  const usageLogs = { create: jest.fn() };

  beforeEach(() => {
    client.generateJson.mockReset().mockResolvedValue({
      text: '{"score":80}',
      model: 'model-pro',
      promptTokens: 12,
      outputTokens: 8,
    });
    usageLogs.create.mockReset().mockResolvedValue({});
    service = new LlmService(
      client as unknown as LlmClient,
      usageLogs as unknown as AiUsageLogsService,
    );
  });

  afterEach(() => jest.useRealTimers());

  // C2 — the "Ánh xạ" table of the part 0 spec.
  const operations = [
    { method: 'parseCV', tier: 'flash', reasoning: 'medium', action: AiActionType.cv_parsing, prompt: CV_PARSING_PROMPT },
    { method: 'parseJD', tier: 'flash', reasoning: 'medium', action: AiActionType.job_parsing, prompt: JD_PARSING_PROMPT },
    { method: 'screeningCV', tier: 'pro', reasoning: 'high', action: AiActionType.cv_scoring, prompt: CV_SCREENING_PROMPT },
    { method: 'generateInterviewQuestions', tier: 'pro', reasoning: 'high', action: AiActionType.mock_interview, prompt: MOCK_INTERVIEW_GENERATE_PROMPT },
    { method: 'checkInterviewFollowup', tier: 'flash', reasoning: 'high', action: AiActionType.mock_interview, prompt: MOCK_INTERVIEW_FOLLOWUP_PROMPT },
    { method: 'evaluateInterviewAnswer', tier: 'flash', reasoning: 'high', action: AiActionType.mock_interview, prompt: MOCK_INTERVIEW_EVALUATE_PROMPT },
    { method: 'generateInterviewResult', tier: 'pro', reasoning: 'high', action: AiActionType.mock_interview, prompt: MOCK_INTERVIEW_RESULT_PROMPT },
  ] as const;

  it.each(operations)(
    'C2 $method sends tier $tier, reasoning $reasoning, its action type and its system prompt',
    async ({ method, tier, reasoning, action, prompt }) => {
      await expect(service[method]('ref-1', 'source text')).resolves.toEqual({
        score: 80,
      });

      expect(client.generateJson).toHaveBeenCalledTimes(1);
      const req: LlmRequest = client.generateJson.mock.calls[0][0];
      expect(req).toEqual({
        refId: 'ref-1',
        actionType: action,
        tier,
        reasoning,
        systemPrompt: prompt,
        content:
          method === 'parseJD'
            ? '<jd_text>\nsource text\n</jd_text>'
            : 'source text',
        signal: expect.any(AbortSignal),
      });
    },
  );

  it('success logs model, promptTokens, completionTokens = outputTokens, status success', async () => {
    await service.screeningCV('scr-1', 'text');

    expect(usageLogs.create).toHaveBeenCalledTimes(1);
    expect(usageLogs.create).toHaveBeenCalledWith({
      refId: 'scr-1',
      actionType: AiActionType.cv_scoring,
      model: 'model-pro',
      promptTokenCount: 12,
      candidatesTokenCount: 8,
      duration: expect.any(Number),
      status: AiLogStatus.success,
    });
  });

  it('accepts a null refId', async () => {
    await service.parseCV(null, 'text');

    expect(client.generateJson.mock.calls[0][0].refId).toBeNull();
    expect(usageLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({ refId: null }),
    );
  });

  it('C5 unparseable JSON → throws and logs exactly one failed row with the tier model', async () => {
    client.generateJson.mockResolvedValue({
      text: 'not JSON',
      model: 'model-flash',
      promptTokens: 12,
      outputTokens: 8,
    });

    await expect(service.parseCV('cv-1', 'text')).rejects.toBeInstanceOf(
      SyntaxError,
    );

    expect(usageLogs.create).toHaveBeenCalledTimes(1);
    expect(usageLogs.create).toHaveBeenCalledWith({
      refId: 'cv-1',
      actionType: AiActionType.cv_parsing,
      model: 'model-flash',
      promptTokenCount: 0,
      candidatesTokenCount: 0,
      duration: expect.any(Number),
      status: AiLogStatus.failed,
    });
  });

  it('preserves provider errors so BullMQ can retry and logs exactly one failure', async () => {
    const error = new Error('429 quota exceeded');
    client.generateJson.mockRejectedValue(error);

    await expect(service.screeningCV('scr-1', 'text')).rejects.toBe(error);

    expect(usageLogs.create).toHaveBeenCalledTimes(1);
    expect(usageLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        refId: 'scr-1',
        actionType: AiActionType.cv_scoring,
        model: 'model-pro',
        status: AiLogStatus.failed,
      }),
    );
  });

  it('C5 timeout: aborts a stalled call at 120 seconds, logs failed and throws', async () => {
    jest.useFakeTimers();
    const error = Object.assign(new Error('aborted'), { name: 'AbortError' });
    client.generateJson.mockImplementation(
      (req: LlmRequest) =>
        new Promise((_, reject) => {
          req.signal.addEventListener('abort', () => reject(error));
        }),
    );
    const pending = expect(service.parseCV('cv-1', 'text')).rejects.toBe(error);

    await jest.advanceTimersByTimeAsync(119_999);
    expect(usageLogs.create).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    await pending;

    expect(usageLogs.create).toHaveBeenCalledTimes(1);
    expect(usageLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: AiLogStatus.failed }),
    );
    expect(jest.getTimerCount()).toBe(0);
  });

  it('clears the timeout after a successful call', async () => {
    jest.useFakeTimers();

    await service.parseCV('cv-1', 'text');

    expect(jest.getTimerCount()).toBe(0);
  });

  it('log failure does not fail the call', async () => {
    usageLogs.create.mockRejectedValue(new Error('db down'));

    await expect(service.parseCV('cv-1', 'text')).resolves.toEqual({
      score: 80,
    });
    await new Promise((resolve) => setImmediate(resolve));
  });
});

describe('createLlmClient (C1)', () => {
  const buildConfig = (env: Record<string, string>) =>
    ({
      get: (key: string) => env[key],
      getOrThrow: (key: string) => {
        if (env[key] === undefined) throw new Error(`missing ${key}`);
        return env[key];
      },
    }) as unknown as ConfigService;

  it('AI_PROVIDER not set → GeminiClient', () => {
    const config = buildConfig({ GOOGLE_API_KEY: 'g' });

    expect(createLlmClient(config)).toBeInstanceOf(GeminiClient);
  });

  it('AI_PROVIDER=gemini → GeminiClient', () => {
    const config = buildConfig({ AI_PROVIDER: 'gemini', GOOGLE_API_KEY: 'g' });

    expect(createLlmClient(config)).toBeInstanceOf(GeminiClient);
  });

  it('AI_PROVIDER=openai → OpenAiClient, without needing GOOGLE_API_KEY', () => {
    const config = buildConfig({ AI_PROVIDER: 'openai', OPENAI_API_KEY: 'o' });

    expect(createLlmClient(config)).toBeInstanceOf(OpenAiClient);
  });
});
