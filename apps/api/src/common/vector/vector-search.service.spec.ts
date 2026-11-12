import { Prisma } from '@ats-platform/database';
import {
  EMBEDDING_TARGETS,
  toVectorLiteral,
  VectorSearchService,
} from './vector-search.service';

const vectorOf = (length: number, value = 0.5) =>
  new Array<number>(length).fill(value);

describe('toVectorLiteral', () => {
  it('formats 1536 numbers as [a,b,…]', () => {
    const values = vectorOf(1536, 0.25);
    values[0] = -1;
    values[1535] = 0;

    const literal = toVectorLiteral(values);

    expect(literal.startsWith('[-1,0.25,')).toBe(true);
    expect(literal.endsWith(',0.25,0]')).toBe(true);
    expect(literal.split(',')).toHaveLength(1536);
  });

  it('keeps tiny and large magnitudes parseable', () => {
    const values = vectorOf(1536);
    values[0] = 1e-7;
    values[1] = 123456.789;

    expect(toVectorLiteral(values).startsWith('[1e-7,123456.789,')).toBe(true);
  });

  it.each([0, 1, 1535, 1537, 3072])('rejects %i values', (length) => {
    expect(() => toVectorLiteral(vectorOf(length))).toThrow(
      /1536/,
    );
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejects %s anywhere in the vector (Review Focus 1)',
    (bad) => {
      for (const position of [0, 700, 1535]) {
        const values = vectorOf(1536);
        values[position] = bad;
        expect(() => toVectorLiteral(values)).toThrow(/finite/);
      }
    },
  );
});

describe('VectorSearchService', () => {
  const prisma = { $executeRaw: jest.fn(), $queryRaw: jest.fn() };
  let service: VectorSearchService;

  beforeEach(() => {
    prisma.$executeRaw.mockReset().mockResolvedValue(1);
    prisma.$queryRaw.mockReset().mockResolvedValue([]);
    service = new VectorSearchService(prisma as never);
  });

  const sqlOf = (mock: jest.Mock): Prisma.Sql => mock.mock.calls[0][0];

  describe('writeEmbedding', () => {
    it('uses $executeRaw with the literal and the id as parameters, never string-concatenated', async () => {
      const vector = vectorOf(1536, 0.125);
      const literal = toVectorLiteral(vector);

      await service.writeEmbedding('skill', 'skill-1', vector);

      expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
      const sql = sqlOf(prisma.$executeRaw);
      expect(sql.values).toEqual([literal, 'skill-1']);
      expect(sql.sql).not.toContain(literal);
      expect(sql.sql).not.toContain('skill-1');
      expect(sql.sql).toContain('"skills"');
      expect(sql.sql).toContain('"skill_id"');
      expect(sql.text).toMatch(/\$1::vector/);
    });

    it('addresses the table and key column of each target', async () => {
      await service.writeEmbedding('cv_parsed_data', 'parsed-1', vectorOf(1536));

      const sql = sqlOf(prisma.$executeRaw);
      expect(sql.sql).toContain('"cv_parsed_data"');
      expect(sql.sql).toContain('"id"');
    });

    it('rejects a bad vector before touching the database', async () => {
      await expect(
        service.writeEmbedding('skill', 'skill-1', vectorOf(1535)),
      ).rejects.toThrow(/1536/);

      expect(prisma.$executeRaw).not.toHaveBeenCalled();
    });

    it('does not fail when the row is already gone (0 rows updated)', async () => {
      prisma.$executeRaw.mockResolvedValue(0);

      await expect(
        service.writeEmbedding('skill', 'deleted', vectorOf(1536)),
      ).resolves.toBeUndefined();
    });

    it('refuses a target that is not registered, so a table name can never come from outside', async () => {
      await expect(
        service.writeEmbedding('skills; DROP TABLE users' as never, 'x', vectorOf(1536)),
      ).rejects.toThrow('Unknown embedding target');

      expect(prisma.$executeRaw).not.toHaveBeenCalled();
    });
  });

  describe('readEmbeddings', () => {
    it('readEmbeddings([]) returns an empty map without querying', async () => {
      const result = await service.readEmbeddings('skill', []);

      expect(result.size).toBe(0);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('parses the pgvector text form into numbers, keyed by id, with the ids as a parameter', async () => {
      prisma.$queryRaw.mockResolvedValue([
        { id: 'a', embedding: '[0.1,0.2,0.3]' },
        { id: 'b', embedding: '[1,-2e-7,0]' },
      ]);

      const result = await service.readEmbeddings('skill', ['a', 'b', 'c']);

      expect(result.get('a')).toEqual([0.1, 0.2, 0.3]);
      expect(result.get('b')).toEqual([1, -2e-7, 0]);
      // Control: a row the query did not return is simply absent.
      expect(result.has('c')).toBe(false);
      expect(sqlOf(prisma.$queryRaw).values).toEqual([['a', 'b', 'c']]);
      expect(sqlOf(prisma.$queryRaw).sql).toMatch(/"embedding" IS NOT NULL/);
    });
  });

  describe('findMissing', () => {
    it('returns ids whose embedding is null, bounded by the limit parameter', async () => {
      prisma.$queryRaw.mockResolvedValue([{ id: 'x' }, { id: 'y' }]);

      const result = await service.findMissing('cv_parsed_data', 50);

      expect(result).toEqual(['x', 'y']);
      const sql = sqlOf(prisma.$queryRaw);
      expect(sql.values).toEqual([50]);
      expect(sql.sql).toMatch(/"embedding" IS NULL/);
      expect(sql.sql).toContain('"cv_parsed_data"');
    });

    it.each([0, -1, 1.5, Number.NaN])('rejects a limit of %s', async (limit) => {
      await expect(service.findMissing('skill', limit)).rejects.toThrow(
        /positive integer/,
      );

      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('nearestAnchorScreenings (C6, Review Focus 2, E3)', () => {
    const cvVector = vectorOf(1536, 0.25);

    it('returns screening ids in the order the database ranks them', async () => {
      prisma.$queryRaw.mockResolvedValue([{ id: 's2' }, { id: 's1' }]);

      await expect(
        service.nearestAnchorScreenings('job-1', 'app-1', cvVector, 3),
      ).resolves.toEqual(['s2', 's1']);
    });

    it('filters on the same job, away from this application, and on reviewed screenings with a vector — all as parameters', async () => {
      await service.nearestAnchorScreenings('job-1', 'app-1', cvVector, 3);

      const sql = sqlOf(prisma.$queryRaw);
      // Parameters only: the job id, the application id, the vector literal and the limit.
      expect(sql.values).toEqual(['job-1', 'app-1', toVectorLiteral(cvVector), 3]);
      expect(sql.text).toMatch(/a\."job_id" = \$1/);
      expect(sql.text).toMatch(/s\."application_id" <> \$2/);
      expect(sql.text).toMatch(/s\."reviewed_at" IS NOT NULL/);
      expect(sql.text).toMatch(/p\."embedding" IS NOT NULL/);
      expect(sql.text).toMatch(/ORDER BY p\."embedding" <=> \$3::vector/);
      expect(sql.text).toMatch(/LIMIT \$4/);
      expect(sql.sql).not.toContain('job-1');
      expect(sql.sql).not.toContain(toVectorLiteral(cvVector));
    });

    it('rejects a bad vector or limit before touching the database', async () => {
      await expect(
        service.nearestAnchorScreenings('job-1', 'app-1', vectorOf(1535), 3),
      ).rejects.toThrow(/1536/);
      await expect(
        service.nearestAnchorScreenings('job-1', 'app-1', cvVector, 0),
      ).rejects.toThrow(/positive integer/);

      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('nearestQuestions (C11, C10)', () => {
    const vector = vectorOf(1536, 0.25);
    const row = (id: string) => ({
      questionId: id,
      questionText: `Q ${id}`,
      expectedPoints: ['p'],
      difficulty: 'medium',
    });

    it('returns the bank questions in the order the database ranks them', async () => {
      prisma.$queryRaw.mockResolvedValue([row('q2'), row('q1')]);

      await expect(
        service.nearestQuestions('topic-1', 'medium', vector, 25),
      ).resolves.toEqual([row('q2'), row('q1')]);
    });

    it('keeps to the topic and the difficulty, to active questions that have a vector — all as parameters', async () => {
      await service.nearestQuestions('topic-1', 'hard', vector, 25);

      const sql = sqlOf(prisma.$queryRaw);
      expect(sql.values).toEqual(['topic-1', 'hard', toVectorLiteral(vector), 25]);
      expect(sql.text).toMatch(/"topic_id" = \$1/);
      expect(sql.text).toMatch(/"difficulty" = \$2::difficulty_level/);
      expect(sql.text).toMatch(/"is_active" = true/);
      expect(sql.text).toMatch(/"embedding" IS NOT NULL/);
      expect(sql.text).toMatch(/ORDER BY "embedding" <=> \$3::vector/);
      expect(sql.text).toMatch(/LIMIT \$4/);
      expect(sql.sql).not.toContain('topic-1');
    });

    it('rejects a bad vector or limit before touching the database', async () => {
      await expect(
        service.nearestQuestions('topic-1', 'easy', vectorOf(10), 25),
      ).rejects.toThrow(/1536/);
      await expect(
        service.nearestQuestions('topic-1', 'easy', vector, 0),
      ).rejects.toThrow(/positive integer/);

      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });
  });

  it('registers exactly the targets that have a table today', () => {
    expect(Object.keys(EMBEDDING_TARGETS).sort()).toEqual([
      'cv_parsed_data',
      'interview_question',
      'skill',
    ]);
  });

  it('addresses the question bank by its own table and key', async () => {
    await service.writeEmbedding('interview_question', 'q-1', vectorOf(1536));

    const sql = sqlOf(prisma.$executeRaw);
    expect(sql.sql).toContain('"interview_questions"');
    expect(sql.sql).toContain('"question_id"');
  });
});
