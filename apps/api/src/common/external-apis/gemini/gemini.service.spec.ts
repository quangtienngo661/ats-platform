import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from './gemini.service';
import { AiUsageLogsService } from '../../../app/ai-usage-logs/ai-usage-logs.service';
import { AiActionType, AiLogStatus } from '@ats-platform/database';
import { GeminiModel } from '../../types/enums/gemini-model.enum';

const mockGenerateContent = jest.fn();
jest.mock('@google/genai', () => ({
  ...jest.requireActual('@google/genai'),
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}));

describe('GeminiService', () => {
  let service: GeminiService;
  const usageLogs = { create: jest.fn() };

  beforeEach(async () => {
    mockGenerateContent.mockReset();
    usageLogs.create.mockReset().mockResolvedValue({});
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('test-api-key') },
        },
        { provide: AiUsageLogsService, useValue: usageLogs },
      ],
    }).compile();

    service = module.get<GeminiService>(GeminiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => jest.useRealTimers());

  const operations = [
    {
      method: 'parseCV',
      action: AiActionType.cv_parsing,
      model: GeminiModel.Flash,
    },
    {
      method: 'parseJD',
      action: AiActionType.job_parsing,
      model: GeminiModel.Flash,
    },
    {
      method: 'screeningCV',
      action: AiActionType.cv_scoring,
      model: GeminiModel.Pro,
    },
    {
      method: 'generateInterviewQuestions',
      action: AiActionType.mock_interview,
      model: GeminiModel.Pro,
    },
    {
      method: 'checkInterviewFollowup',
      action: AiActionType.mock_interview,
      model: GeminiModel.Flash,
    },
    {
      method: 'evaluateInterviewAnswer',
      action: AiActionType.mock_interview,
      model: GeminiModel.Flash,
    },
    {
      method: 'generateInterviewResult',
      action: AiActionType.mock_interview,
      model: GeminiModel.Pro,
    },
  ] as const;

  it.each(operations)(
    '$method parses JSON and records the correct model/action/token counts',
    async ({ method, action, model }) => {
      mockGenerateContent.mockResolvedValue({
        text: '{"score":80}',
        usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 8 },
      });

      await expect(service[method]('ref-1', 'source text')).resolves.toEqual({
        score: 80,
      });

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model,
        contents:
          method === 'parseJD'
            ? '<jd_text>\nsource text\n</jd_text>'
            : 'source text',
        config: expect.objectContaining({
          abortSignal: expect.any(AbortSignal),
        }),
      });
      expect(usageLogs.create).toHaveBeenCalledTimes(1);
      expect(usageLogs.create).toHaveBeenCalledWith({
        refId: 'ref-1',
        actionType: action,
        model,
        promptTokenCount: 12,
        candidatesTokenCount: 8,
        duration: expect.any(Number),
        status: AiLogStatus.success,
      });
    },
  );

  it('accepts valid JSON even when the SDK omits optional usageMetadata', async () => {
    mockGenerateContent.mockResolvedValue({ text: '{"summary":"Engineer"}' });

    await expect(service.parseCV('cv-1', 'text')).resolves.toEqual({
      summary: 'Engineer',
    });

    expect(usageLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        promptTokenCount: 0,
        candidatesTokenCount: 0,
        status: AiLogStatus.success,
      }),
    );
  });

  it('records malformed JSON as one failed call rather than success plus failure', async () => {
    mockGenerateContent.mockResolvedValue({
      text: 'not JSON',
      usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 8 },
    });

    await expect(service.parseCV('cv-1', 'text')).rejects.toBeInstanceOf(
      SyntaxError,
    );

    expect(usageLogs.create).toHaveBeenCalledTimes(1);
    expect(usageLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: AiLogStatus.failed }),
    );
  });

  it('preserves API errors so BullMQ can retry and records exactly one failure', async () => {
    const error = new Error('429 quota exceeded');
    mockGenerateContent.mockRejectedValue(error);

    await expect(service.screeningCV('scr-1', 'text')).rejects.toBe(error);

    expect(usageLogs.create).toHaveBeenCalledTimes(1);
    expect(usageLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        refId: 'scr-1',
        actionType: AiActionType.cv_scoring,
        status: AiLogStatus.failed,
      }),
    );
  });

  it('aborts a stalled SDK request at its configured 120 second deadline', async () => {
    jest.useFakeTimers();
    const error = Object.assign(new Error('aborted'), { name: 'AbortError' });
    mockGenerateContent.mockImplementation(
      ({ config }) =>
        new Promise((_, reject) => {
          config.abortSignal.addEventListener('abort', () => reject(error));
        }),
    );
    const pending = expect(service.parseCV('cv-1', 'text')).rejects.toBe(error);

    await jest.advanceTimersByTimeAsync(120_000);
    await pending;

    expect(usageLogs.create).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });
});
