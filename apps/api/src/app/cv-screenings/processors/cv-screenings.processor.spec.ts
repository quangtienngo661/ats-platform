import { ScreeningStatus } from '@ats-platform/database';
import { CvScreeningProcessor } from './cv-screenings.processor';
import { createPrismaMock } from '../../../test-utils/unit-test-helpers';

describe('CvScreeningProcessor', () => {
  let processor: CvScreeningProcessor;
  let prisma: ReturnType<typeof createPrismaMock>;
  let cvScreeningsService: {
    calculateOverallScore: jest.Mock;
    determineRecommendation: jest.Mock;
  };
  let geminiService: { screeningCV: jest.Mock };
  let socketIoService: { handleEmit: jest.Mock };
  let notificationsService: { create: jest.Mock };

  const buildJob = (attemptsMade: number, attempts = 3) =>
    ({
      name: 'process-cv-screening',
      data: {
        screeningId: 'scr-1',
        cvId: 'cv-1',
        applicationId: 'app-1',
        configId: 'cfg-1',
      },
      attemptsMade,
      opts: { attempts },
    }) as any;

  const primeContext = () => {
    prisma.cVParsedData.findUnique.mockResolvedValue({
      cvId: 'cv-1',
      skills: [],
    });
    prisma.application.findUnique.mockResolvedValue({
      applicationId: 'app-1',
      jobId: 'job-1',
      jobPosting: {
        parsedRequirements: {},
        recruiter: { userId: 'rec-user-1' },
        jobPostingSkills: [],
      },
    });
    prisma.aiConfig.findUnique.mockResolvedValue({
      configId: 'cfg-1',
      minimumScoreThreshold: 50,
    });
    prisma.cVScreening.update.mockResolvedValue({
      screeningId: 'scr-1',
      applicationId: 'app-1',
    });
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    cvScreeningsService = {
      calculateOverallScore: jest.fn().mockReturnValue(80),
      determineRecommendation: jest.fn().mockReturnValue('interview'),
    };
    geminiService = { screeningCV: jest.fn() };
    socketIoService = { handleEmit: jest.fn() };
    notificationsService = { create: jest.fn() };

    processor = new CvScreeningProcessor(
      cvScreeningsService as any,
      prisma as any,
      geminiService as any,
      socketIoService as any,
      notificationsService as any,
    );
  });

  it('rethrows while retries remain, without marking the screening failed', async () => {
    primeContext();
    geminiService.screeningCV.mockRejectedValue(new Error('Gemini timeout'));

    // Attempt 1 of 3 — BullMQ must see a rejection so it schedules a retry.
    await expect(processor.process(buildJob(0, 3))).rejects.toThrow(
      'Gemini timeout',
    );

    const failedWrite = prisma.cVScreening.update.mock.calls.find(
      ([args]: any[]) => args?.data?.status === ScreeningStatus.failed,
    );
    expect(failedWrite).toBeUndefined();
    expect(socketIoService.handleEmit).not.toHaveBeenCalled();
  });

  it('marks the screening failed on the final attempt and still rethrows', async () => {
    primeContext();
    geminiService.screeningCV.mockRejectedValue(new Error('Gemini timeout'));

    // Attempt 3 of 3 — record the failure, but the job must still be recorded as
    // failed by BullMQ, so the error has to propagate.
    await expect(processor.process(buildJob(2, 3))).rejects.toThrow(
      'Gemini timeout',
    );

    const failedWrite = prisma.cVScreening.update.mock.calls.find(
      ([args]: any[]) => args?.data?.status === ScreeningStatus.failed,
    );
    expect(failedWrite).toBeDefined();
    expect(failedWrite[0].data.errorLog).toBe('Gemini timeout');
  });

  it('skips the in-app notification for a silent job but still emits the socket event', async () => {
    primeContext();
    geminiService.screeningCV.mockResolvedValue({
      skills_score: 80,
      experience_score: 80,
      education_score: 80,
      ai_reasoning: 'The candidate meets the requirements.',
      matched_skills: [],
      missing_skills: [],
      matched_nice_to_haves: [],
    });
    const job = buildJob(0);
    job.data.notify = false;

    await expect(processor.process(job)).resolves.toBeUndefined();

    expect(notificationsService.create).not.toHaveBeenCalled();
    expect(socketIoService.handleEmit).toHaveBeenCalledWith(
      'cv-screening:completed',
      expect.objectContaining({ applicationId: 'app-1' }),
      'job_job-1',
    );
  });

  it('still notifies for a job without the flag', async () => {
    primeContext();
    geminiService.screeningCV.mockResolvedValue({
      skills_score: 80,
      experience_score: 80,
      education_score: 80,
      ai_reasoning: 'The candidate meets the requirements.',
      matched_skills: [],
      missing_skills: [],
      matched_nice_to_haves: [],
    });

    await expect(processor.process(buildJob(0))).resolves.toBeUndefined();

    expect(notificationsService.create).toHaveBeenCalled();
    expect(socketIoService.handleEmit).toHaveBeenCalledWith(
      'cv-screening:completed',
      expect.objectContaining({ applicationId: 'app-1' }),
      'job_job-1',
    );
  });
});
