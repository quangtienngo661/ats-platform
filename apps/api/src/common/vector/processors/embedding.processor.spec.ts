import { EmbeddingProcessor } from './embedding.processor';

describe('EmbeddingProcessor', () => {
  const prisma = {
    skill: { findUnique: jest.fn() },
    cVParsedData: { findUnique: jest.fn() },
    interviewQuestion: { findUnique: jest.fn() },
  };
  const embeddingService = { embed: jest.fn() };
  const vectorSearch = { writeEmbedding: jest.fn() };
  let processor: EmbeddingProcessor;
  const vector = new Array(1536).fill(0.5);
  const job = (target: string, id: string, name = 'embed') =>
    ({ name, data: { target, id } }) as never;

  beforeEach(() => {
    jest.resetAllMocks();
    embeddingService.embed.mockResolvedValue([vector]);
    vectorSearch.writeEmbedding.mockResolvedValue(undefined);
    processor = new EmbeddingProcessor(
      prisma as never,
      embeddingService as never,
      vectorSearch as never,
    );
  });

  it('embeds and writes the vector for a skill, using its name and synonyms', async () => {
    prisma.skill.findUnique.mockResolvedValue({
      name: 'React',
      synonyms: ['ReactJS'],
    });

    await processor.process(job('skill', 'skill-1'));

    expect(prisma.skill.findUnique).toHaveBeenCalledWith({
      where: { skillId: 'skill-1' },
      select: { name: true, synonyms: true },
    });
    expect(embeddingService.embed).toHaveBeenCalledWith('skill-1', [
      'React; ReactJS',
    ]);
    expect(vectorSearch.writeEmbedding).toHaveBeenCalledWith(
      'skill',
      'skill-1',
      vector,
    );
  });

  it('embeds and writes the vector for parsed CV data', async () => {
    prisma.cVParsedData.findUnique.mockResolvedValue({
      summary: 'S',
      skills: { technical: ['NestJS'] },
      experience: [{ position: 'Dev' }],
    });

    await processor.process(job('cv_parsed_data', 'p-1'));

    expect(prisma.cVParsedData.findUnique).toHaveBeenCalledWith({
      where: { id: 'p-1' },
      select: { summary: true, skills: true, experience: true },
    });
    expect(embeddingService.embed).toHaveBeenCalledWith('p-1', [
      'S\nSkills: NestJS\nPositions: Dev',
    ]);
    expect(vectorSearch.writeEmbedding).toHaveBeenCalledWith(
      'cv_parsed_data',
      'p-1',
      vector,
    );
  });

  it('embeds and writes the vector for an interview question, using its text', async () => {
    prisma.interviewQuestion.findUnique.mockResolvedValue({
      questionText: 'REST là gì?',
    });

    await processor.process(job('interview_question', 'q-1'));

    expect(prisma.interviewQuestion.findUnique).toHaveBeenCalledWith({
      where: { questionId: 'q-1' },
      select: { questionText: true },
    });
    expect(embeddingService.embed).toHaveBeenCalledWith('q-1', ['REST là gì?']);
    expect(vectorSearch.writeEmbedding).toHaveBeenCalledWith(
      'interview_question',
      'q-1',
      vector,
    );
  });

  it('text null → skips without calling the API', async () => {
    prisma.cVParsedData.findUnique.mockResolvedValue({
      summary: null,
      skills: null,
      experience: null,
    });

    await expect(
      processor.process(job('cv_parsed_data', 'p-1')),
    ).resolves.toBeUndefined();

    expect(embeddingService.embed).not.toHaveBeenCalled();
    expect(vectorSearch.writeEmbedding).not.toHaveBeenCalled();
  });

  it('row deleted → completes without error and without calling the API', async () => {
    prisma.skill.findUnique.mockResolvedValue(null);

    await expect(
      processor.process(job('skill', 'gone')),
    ).resolves.toBeUndefined();

    expect(embeddingService.embed).not.toHaveBeenCalled();
    expect(vectorSearch.writeEmbedding).not.toHaveBeenCalled();
  });

  it('API error → rethrows so BullMQ retries, and writes nothing', async () => {
    prisma.skill.findUnique.mockResolvedValue({
      name: 'React',
      synonyms: null,
    });
    const error = new Error('429 rate limited');
    embeddingService.embed.mockRejectedValue(error);

    await expect(processor.process(job('skill', 'skill-1'))).rejects.toBe(
      error,
    );

    expect(vectorSearch.writeEmbedding).not.toHaveBeenCalled();
  });

  it('a write error is rethrown too', async () => {
    prisma.skill.findUnique.mockResolvedValue({
      name: 'React',
      synonyms: null,
    });
    vectorSearch.writeEmbedding.mockRejectedValue(new Error('db down'));

    await expect(processor.process(job('skill', 'skill-1'))).rejects.toThrow(
      'db down',
    );
  });

  it('ignores a job that is not "embed"', async () => {
    await processor.process(job('skill', 'skill-1', 'something-else'));

    expect(prisma.skill.findUnique).not.toHaveBeenCalled();
  });

  it('fails a job with a target it does not know instead of completing silently', async () => {
    await expect(processor.process(job('users', 'u-1'))).rejects.toThrow(
      'Unknown embedding target',
    );
  });
});
