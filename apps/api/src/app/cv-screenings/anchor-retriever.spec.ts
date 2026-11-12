import { RagMode } from '@ats-platform/types';
import { AnchorRetriever, selectRagMode } from './anchor-retriever';

describe('selectRagMode (C6)', () => {
  const base = { embeddingsAvailable: true, reviewedCount: 0, k: 3 };

  it.each<[string, Parameters<typeof selectRagMode>[0], RagMode]>([
    ['k − 1 reviewed screenings → skills', { ...base, reviewedCount: 2 }, 'skills'],
    ['exactly k → skills_anchors', { ...base, reviewedCount: 3 }, 'skills_anchors'],
    ['more than k → skills_anchors', { ...base, reviewedCount: 10 }, 'skills_anchors'],
    ['none reviewed → skills', { ...base, reviewedCount: 0 }, 'skills'],
    ['embeddings unusable → none, whatever is reviewed', { ...base, reviewedCount: 10, embeddingsAvailable: false }, 'none'],
    ['forced none beats everything', { ...base, reviewedCount: 10, forced: 'none' }, 'none'],
    ['forced skills beats enough anchors', { ...base, reviewedCount: 10, forced: 'skills' }, 'skills'],
    ['forced skills_anchors beats too few anchors', { ...base, reviewedCount: 0, forced: 'skills_anchors' }, 'skills_anchors'],
    ['forced skills_anchors beats unusable embeddings', { ...base, embeddingsAvailable: false, forced: 'skills_anchors' }, 'skills_anchors'],
  ])('%s', (_label, input, expected) => {
    expect(selectRagMode(input)).toBe(expected);
  });

  it('k = 1 needs a single reviewed screening', () => {
    expect(selectRagMode({ ...base, k: 1, reviewedCount: 1 })).toBe('skills_anchors');
    expect(selectRagMode({ ...base, k: 1, reviewedCount: 0 })).toBe('skills');
  });
});

describe('AnchorRetriever', () => {
  const vectorSearch = {
    readEmbeddings: jest.fn(),
    nearestAnchorScreenings: jest.fn(),
  };
  const prisma = { cVScreening: { findMany: jest.fn() } };
  let retriever: AnchorRetriever;
  const cvVector = [1, 0, 0];

  const row = (
    screeningId: string,
    overrides: Record<string, unknown> = {},
  ) => ({
    screeningId,
    skillsScore: '80',
    experienceScore: '70',
    educationScore: '60',
    reviewedAt: new Date('2026-10-30T08:00:00.000Z'),
    reviewedSkillsScore: '90',
    reviewedExperienceScore: '65',
    reviewedEducationScore: '55',
    cv: {
      parsedData: {
        summary: `summary of ${screeningId}`,
        skills: { technical: ['NestJS', 'SQL'] },
      },
    },
    ...overrides,
  });

  beforeEach(() => {
    jest.resetAllMocks();
    vectorSearch.readEmbeddings.mockResolvedValue(new Map([['parsed-1', cvVector]]));
    retriever = new AnchorRetriever(prisma as never, vectorSearch as never);
  });

  it('asks the database for the k nearest reviewed screenings of the same job, excluding this application', async () => {
    vectorSearch.nearestAnchorScreenings.mockResolvedValue([]);

    await retriever.retrieve('job-1', 'app-1', 'parsed-1', 3);

    expect(vectorSearch.readEmbeddings).toHaveBeenCalledWith('cv_parsed_data', ['parsed-1']);
    expect(vectorSearch.nearestAnchorScreenings).toHaveBeenCalledWith('job-1', 'app-1', cvVector, 3);
  });

  it('returns the anchors in similarity order with the scores AFTER review', async () => {
    vectorSearch.nearestAnchorScreenings.mockResolvedValue(['s2', 's1']);
    // The database answers in another order than the similarity ranking.
    prisma.cVScreening.findMany.mockResolvedValue([row('s1'), row('s2')]);

    const anchors = await retriever.retrieve('job-1', 'app-1', 'parsed-1', 2);

    expect(anchors.map((a) => a.screeningId)).toEqual(['s2', 's1']);
    expect(anchors[0]).toEqual({
      screeningId: 's2',
      cvSummary: 'summary of s2',
      cvSkills: ['NestJS', 'SQL'],
      skillsScore: 90,
      experienceScore: 65,
      educationScore: 55,
    });
    expect(prisma.cVScreening.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { screeningId: { in: ['s2', 's1'] } } }),
    );
  });

  it('never exposes who the candidate was: no name, email or id of the candidate', async () => {
    vectorSearch.nearestAnchorScreenings.mockResolvedValue(['s1']);
    prisma.cVScreening.findMany.mockResolvedValue([row('s1')]);

    const [anchor] = await retriever.retrieve('job-1', 'app-1', 'parsed-1', 1);

    expect(Object.keys(anchor).sort()).toEqual([
      'cvSkills',
      'cvSummary',
      'educationScore',
      'experienceScore',
      'screeningId',
      'skillsScore',
    ]);
  });

  it('a CV that has no vector yet gets no anchors and no database search', async () => {
    vectorSearch.readEmbeddings.mockResolvedValue(new Map());

    await expect(retriever.retrieve('job-1', 'app-1', 'parsed-1', 3)).resolves.toEqual([]);

    expect(vectorSearch.nearestAnchorScreenings).not.toHaveBeenCalled();
  });

  it('no neighbours found → no anchors and no second query', async () => {
    vectorSearch.nearestAnchorScreenings.mockResolvedValue([]);

    await expect(retriever.retrieve('job-1', 'app-1', 'parsed-1', 3)).resolves.toEqual([]);

    expect(prisma.cVScreening.findMany).not.toHaveBeenCalled();
  });

  it('a neighbour whose parsed data has vanished still returns its scores, with empty text', async () => {
    vectorSearch.nearestAnchorScreenings.mockResolvedValue(['s1']);
    prisma.cVScreening.findMany.mockResolvedValue([row('s1', { cv: { parsedData: null } })]);

    const [anchor] = await retriever.retrieve('job-1', 'app-1', 'parsed-1', 1);

    expect(anchor.cvSummary).toBeNull();
    expect(anchor.cvSkills).toEqual([]);
    expect(anchor.skillsScore).toBe(90);
  });
});
