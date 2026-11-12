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
  let llmService: { screeningCV: jest.Mock };
  let socketIoService: { handleEmit: jest.Mock };
  let notificationsService: { create: jest.Mock };
  let embeddingService: { embed: jest.Mock };
  let vectorSearch: { readEmbeddings: jest.Mock };
  let config: Record<string, string>;

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
    llmService = { screeningCV: jest.fn() };
    socketIoService = { handleEmit: jest.fn() };
    notificationsService = { create: jest.fn() };

    embeddingService = { embed: jest.fn() };
    vectorSearch = { readEmbeddings: jest.fn().mockResolvedValue(new Map()) };
    config = {};

    processor = new CvScreeningProcessor(
      cvScreeningsService as any,
      prisma as any,
      llmService as any,
      socketIoService as any,
      notificationsService as any,
      embeddingService as any,
      vectorSearch as any,
      { get: (key: string) => config[key] } as any,
    );
  });

  describe('skill match (R3, R7, R8, E1, E2, C12)', () => {
    const X = [1, 0, 0];
    const Y = [0, 1, 0];
    const Z = [0, 0, 1];
    const NEAR_X = [0.9, 0.436, 0]; // cosine with X ≈ 0.9

    const llmAnswer = (overrides: Record<string, unknown> = {}) => ({
      skills_score: 80,
      experience_score: 70,
      education_score: 60,
      ai_reasoning: 'ok',
      matched_skills: ['FromLlm'],
      missing_skills: ['AlsoFromLlm'],
      matched_nice_to_haves: ['NiceFromLlm'],
      ...overrides,
    });
    const jobSkill = (id: string, name: string, isRequired = true) => ({
      isRequired,
      skill: { skillId: id, name },
    });
    const prime = (
      technical: unknown,
      jobPostingSkills: ReturnType<typeof jobSkill>[],
      vectors: Record<string, number[]> = {},
    ) => {
      primeContext();
      prisma.cVParsedData.findUnique.mockResolvedValue({
        cvId: 'cv-1',
        skills: { technical },
      });
      prisma.application.findUnique.mockResolvedValue({
        applicationId: 'app-1',
        jobId: 'job-1',
        candidateId: 'cand-1',
        jobPosting: {
          parsedRequirements: {},
          recruiter: { userId: 'rec-user-1' },
          jobPostingSkills,
        },
      });
      vectorSearch.readEmbeddings.mockResolvedValue(
        new Map(Object.entries(vectors)),
      );
      llmService.screeningCV.mockResolvedValue(llmAnswer());
    };
    const completedWrite = () =>
      prisma.cVScreening.update.mock.calls
        .map(([args]: any[]) => args)
        .find((args: any) => args?.data?.status === ScreeningStatus.completed);
    const promptSent = (): string => llmService.screeningCV.mock.calls[0][1];

    it('stores the matcher\'s lists, not the model\'s, and records ragMode "skills"', async () => {
      prime(
        ['ReactJS', 'Postgres'],
        [
          jobSkill('sk-react', 'React'),
          jobSkill('sk-node', 'Node.js'),
          jobSkill('sk-docker', 'Docker', false),
          jobSkill('sk-pg', 'PostgreSQL', false),
        ],
        { 'sk-react': X, 'sk-node': Z, 'sk-docker': Z, 'sk-pg': Y },
      );
      embeddingService.embed.mockResolvedValue([X, Y]);

      await processor.process(buildJob(0));

      const data = completedWrite().data;
      expect(data.matchedSkills).toEqual({
        hardSkills: ['React'],
        niceToHaveSkills: ['PostgreSQL'],
      });
      expect(data.missingSkills).toEqual(['Node.js']);
      expect(data.ragMode).toBe('skills');
    });

    it('puts the computed match in the prompt, naming the CV skill and the similarity', async () => {
      prime(['ReactJS'], [jobSkill('sk-react', 'React'), jobSkill('sk-node', 'Node.js')], {
        'sk-react': NEAR_X,
        'sk-node': Z,
      });
      embeddingService.embed.mockResolvedValue([X]);

      await processor.process(buildJob(0));

      const block = promptSent().match(/<skill_match>\n([\s\S]*?)\n<\/skill_match>/);
      expect(block).not.toBeNull();
      expect(JSON.parse((block?.[1] ?? ""))).toEqual({
        matched_required: [{ skill: 'React', cv_skill: 'ReactJS', similarity: 0.9 }],
        matched_optional: [],
        missing_required: ['Node.js'],
      });
    });

    it('embeds the distinct CV skills once, in one batch, and reads the job skills\' stored vectors', async () => {
      prime(['ReactJS', ' reactjs ', 'NestJS'], [jobSkill('sk-react', 'React')], { 'sk-react': X });
      embeddingService.embed.mockResolvedValue([X, Y]);

      await processor.process(buildJob(0));

      expect(embeddingService.embed).toHaveBeenCalledTimes(1);
      expect(embeddingService.embed).toHaveBeenCalledWith('scr-1', ['ReactJS', 'NestJS']);
      expect(vectorSearch.readEmbeddings).toHaveBeenCalledWith('skill', ['sk-react']);
    });

    it('links every matched skill to the candidate as cv_parsed, creates no Skill and leaves the missing ones out', async () => {
      prime(
        ['ReactJS', 'Postgres'],
        [jobSkill('sk-react', 'React'), jobSkill('sk-pg', 'PostgreSQL', false), jobSkill('sk-node', 'Node.js')],
        { 'sk-react': X, 'sk-pg': Y, 'sk-node': Z },
      );
      embeddingService.embed.mockResolvedValue([X, Y]);

      await processor.process(buildJob(0));

      expect(prisma.candidateSkill.upsert.mock.calls.map(([args]: any[]) => args)).toEqual([
        {
          where: { candidateId_skillId: { candidateId: 'cand-1', skillId: 'sk-react' } },
          create: { candidateId: 'cand-1', skillId: 'sk-react', source: 'cv_parsed' },
          update: {},
        },
        {
          where: { candidateId_skillId: { candidateId: 'cand-1', skillId: 'sk-pg' } },
          create: { candidateId: 'cand-1', skillId: 'sk-pg', source: 'cv_parsed' },
          update: {},
        },
      ]);
      expect((prisma as any).skill.create).not.toHaveBeenCalled();
    });

    it('a failed candidate-skill link does not fail the screening', async () => {
      prime(['ReactJS'], [jobSkill('sk-react', 'React')], { 'sk-react': X });
      embeddingService.embed.mockResolvedValue([X]);
      prisma.candidateSkill.upsert.mockRejectedValue(new Error('db hiccup'));

      await expect(processor.process(buildJob(0))).resolves.toBeUndefined();

      expect(completedWrite()).toBeDefined();
    });

    it('E1: a posting without skills gets an empty <skill_match>, the model still scores, and its lists are kept', async () => {
      prime(['ReactJS'], []);

      await processor.process(buildJob(0));

      expect(llmService.screeningCV).toHaveBeenCalledTimes(1);
      const block = promptSent().match(/<skill_match>\n([\s\S]*?)\n<\/skill_match>/);
      expect(JSON.parse((block?.[1] ?? ""))).toEqual({
        matched_required: [],
        matched_optional: [],
        missing_required: [],
      });
      expect(embeddingService.embed).not.toHaveBeenCalled();
      const data = completedWrite().data;
      expect(data.matchedSkills).toEqual({
        hardSkills: ['FromLlm'],
        niceToHaveSkills: ['NiceFromLlm'],
      });
      expect(data.missingSkills).toEqual(['AlsoFromLlm']);
      expect(data.ragMode).toBe('skills');
    });

    it.each([
      ['null', null],
      ['an empty string', ''],
      ['an empty list', []],
      ['a list of blanks', ['  ', '']],
      ['missing', undefined],
    ])('Review Focus 4: CV technical skills %s → no embed call, every required skill is missing, the model is still called', async (_label, technical) => {
      prime(technical, [jobSkill('sk-react', 'React'), jobSkill('sk-pg', 'PostgreSQL', false)], {
        'sk-react': X,
      });

      await processor.process(buildJob(0));

      expect(embeddingService.embed).not.toHaveBeenCalled();
      expect(llmService.screeningCV).toHaveBeenCalledTimes(1);
      const data = completedWrite().data;
      expect(data.matchedSkills).toEqual({ hardSkills: [], niceToHaveSkills: [] });
      expect(data.missingSkills).toEqual(['React']);
      expect(data.ragMode).toBe('skills');
      expect(prisma.candidateSkill.upsert).not.toHaveBeenCalled();
    });

    it('E2: a job skill with no stored vector yet is matched by name', async () => {
      prime(['react'], [jobSkill('sk-react', 'React'), jobSkill('sk-node', 'Node.js')]);
      embeddingService.embed.mockResolvedValue([X]);

      await processor.process(buildJob(0));

      const data = completedWrite().data;
      expect(data.matchedSkills.hardSkills).toEqual(['React']);
      expect(data.missingSkills).toEqual(['Node.js']);
    });

    it('C12: when embedding fails the screening runs without the match, as before, and records ragMode "none"', async () => {
      prime(['ReactJS'], [jobSkill('sk-react', 'React')], { 'sk-react': X });
      embeddingService.embed.mockRejectedValue(new Error('OPENAI_API_KEY is required'));

      await expect(processor.process(buildJob(0))).resolves.toBeUndefined();

      expect(promptSent()).not.toContain('<skill_match>');
      const data = completedWrite().data;
      expect(data.ragMode).toBe('none');
      expect(data.matchedSkills).toEqual({
        hardSkills: ['FromLlm'],
        niceToHaveSkills: ['NiceFromLlm'],
      });
      expect(data.missingSkills).toEqual(['AlsoFromLlm']);
      expect(prisma.candidateSkill.upsert).not.toHaveBeenCalled();
    });

    it('a failed read of the job skills\' vectors degrades the same way', async () => {
      prime(['ReactJS'], [jobSkill('sk-react', 'React')]);
      embeddingService.embed.mockResolvedValue([X]);
      vectorSearch.readEmbeddings.mockRejectedValue(new Error('db down'));

      await processor.process(buildJob(0));

      expect(promptSent()).not.toContain('<skill_match>');
      expect(completedWrite().data.ragMode).toBe('none');
    });

    it('a job forced to ragMode "none" skips the match entirely', async () => {
      prime(['ReactJS'], [jobSkill('sk-react', 'React')], { 'sk-react': X });
      const job = buildJob(0);
      job.data.ragMode = 'none';

      await processor.process(job);

      expect(embeddingService.embed).not.toHaveBeenCalled();
      expect(promptSent()).not.toContain('<skill_match>');
      expect(completedWrite().data.ragMode).toBe('none');
    });

    it('uses SKILL_MATCH_THRESHOLD, and 0.8 when it is not set', async () => {
      prime(['ReactJS'], [jobSkill('sk-react', 'React')], { 'sk-react': NEAR_X });
      embeddingService.embed.mockResolvedValue([X]);

      await processor.process(buildJob(0)); // similarity ≈ 0.9 ≥ 0.8
      expect(completedWrite().data.matchedSkills.hardSkills).toEqual(['React']);

      prisma.cVScreening.update.mockClear();
      llmService.screeningCV.mockClear();
      config.SKILL_MATCH_THRESHOLD = '0.95';
      await processor.process(buildJob(0)); // 0.9 < 0.95
      expect(completedWrite().data.matchedSkills.hardSkills).toEqual([]);
      expect(completedWrite().data.missingSkills).toEqual(['React']);
    });
  });

  // B-01: the job posting's skills were fetched but never reached the prompt.
  it('screening prompt contains a <skill_match> block listing the job\'s required skills', async () => {
    primeContext();
    prisma.application.findUnique.mockResolvedValue({
      applicationId: 'app-1',
      jobId: 'job-1',
      jobPosting: {
        parsedRequirements: {},
        recruiter: { userId: 'rec-user-1' },
        jobPostingSkills: [
          { isRequired: true, skill: { skillId: 'sk-react', name: 'React' } },
          { isRequired: false, skill: { skillId: 'sk-docker', name: 'Docker' } },
        ],
      },
    });
    llmService.screeningCV.mockResolvedValue({
      skills_score: 80,
      experience_score: 80,
      education_score: 80,
      ai_reasoning: 'ok',
      matched_skills: [],
      missing_skills: [],
      matched_nice_to_haves: [],
    });

    await processor.process(buildJob(0));

    const content: string = llmService.screeningCV.mock.calls[0][1];
    expect(content).toContain('<skill_match>');
    expect(content).toContain('React');
  });

  it('rethrows while retries remain, without marking the screening failed', async () => {
    primeContext();
    llmService.screeningCV.mockRejectedValue(new Error('Gemini timeout'));

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
    llmService.screeningCV.mockRejectedValue(new Error('Gemini timeout'));

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
    llmService.screeningCV.mockResolvedValue({
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
    llmService.screeningCV.mockResolvedValue({
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
