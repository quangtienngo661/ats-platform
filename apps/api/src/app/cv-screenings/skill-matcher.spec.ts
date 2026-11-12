import { cosine, matchSkills } from './skill-matcher';

// Three-dimensional vectors built by hand, so every similarity below can be checked on paper.
const X = [1, 0, 0];
const Y = [0, 1, 0];
const NEAR_X = [0.9, 0.1, 0]; // cosine with X ≈ 0.994
const AT_45 = [1, 1, 0]; // cosine with X = 1/√2 ≈ 0.7071

const job = (
  skillId: string,
  name: string,
  vector: number[] | null,
  isRequired = true,
) => ({ skillId, name, isRequired, vector });
const cv = (text: string, vector: number[]) => ({ text, vector });

describe('cosine', () => {
  it('is 1 for identical directions, 0 for orthogonal ones, -1 for opposite ones', () => {
    expect(cosine(X, X)).toBeCloseTo(1, 12);
    expect(cosine(X, Y)).toBe(0);
    expect(cosine(X, [-1, 0, 0])).toBeCloseTo(-1, 12);
  });

  it('ignores magnitude', () => {
    expect(cosine(X, [5, 0, 0])).toBeCloseTo(1, 12);
  });

  it('is 0 instead of NaN when a vector is all zeros', () => {
    expect(cosine([0, 0, 0], X)).toBe(0);
    expect(cosine(X, [0, 0, 0])).toBe(0);
  });

  it('refuses vectors of different length', () => {
    expect(() => cosine([1, 2], [1, 2, 3])).toThrow(/same length/);
  });
});

describe('matchSkills (C4)', () => {
  it('splits the job skills into matched required, matched optional and missing required', () => {
    const result = matchSkills(
      [cv('NestJS', X), cv('Postgres', Y)],
      [
        job('j1', 'NestJS', X),
        job('j2', 'PostgreSQL', [0.009, 0.99, 0]), // close to Y
        job('j3', 'Docker', [0, 0, 1]),
        job('j4', 'Kubernetes', [0, 0, 1], false),
        job('j5', 'Express', X, false),
      ],
      0.8,
    );

    expect(result.matchedRequired.map((m) => [m.skillId, m.cvSkill])).toEqual([
      ['j1', 'NestJS'],
      ['j2', 'Postgres'],
    ]);
    expect(result.matchedOptional.map((m) => [m.skillId, m.cvSkill])).toEqual([
      ['j5', 'NestJS'],
    ]);
    expect(result.missingRequired).toEqual([{ skillId: 'j3', name: 'Docker' }]);
  });

  it('an empty CV leaves every required job skill missing and matches nothing', () => {
    const result = matchSkills(
      [],
      [job('j1', 'NestJS', X), job('j2', 'Docker', Y), job('j3', 'Redis', X, false)],
      0.8,
    );

    expect(result.matchedRequired).toEqual([]);
    expect(result.matchedOptional).toEqual([]);
    expect(result.missingRequired).toEqual([
      { skillId: 'j1', name: 'NestJS' },
      { skillId: 'j2', name: 'Docker' },
    ]);
  });

  it('a job without skills gives three empty lists', () => {
    expect(matchSkills([cv('NestJS', X)], [], 0.8)).toEqual({
      matchedRequired: [],
      matchedOptional: [],
      missingRequired: [],
    });
  });

  it('a similarity exactly equal to the threshold matches; just below it does not', () => {
    const similarity = cosine(X, AT_45);
    const jobSkills = [job('j1', 'NestJS', AT_45)];

    const atThreshold = matchSkills([cv('Nest', X)], jobSkills, similarity);
    expect(atThreshold.matchedRequired).toHaveLength(1);
    expect(atThreshold.matchedRequired[0].similarity).toBe(similarity);

    const justAbove = matchSkills([cv('Nest', X)], jobSkills, similarity + 1e-9);
    expect(justAbove.matchedRequired).toEqual([]);
    expect(justAbove.missingRequired).toEqual([{ skillId: 'j1', name: 'NestJS' }]);
  });

  it('several CV skills matching one job skill count once, with the closest CV skill named', () => {
    const result = matchSkills(
      [cv('Node', AT_45), cv('NestJS', NEAR_X), cv('Backend', [1, 0.5, 0])],
      [job('j1', 'NestJS', X)],
      0.5,
    );

    expect(result.matchedRequired).toHaveLength(1);
    expect(result.matchedRequired[0]).toEqual({
      skillId: 'j1',
      name: 'NestJS',
      cvSkill: 'NestJS',
      similarity: cosine(X, NEAR_X),
    });
  });

  it('one CV skill can satisfy several job skills', () => {
    const result = matchSkills(
      [cv('React', X)],
      [job('j1', 'React', X), job('j2', 'ReactJS', NEAR_X)],
      0.8,
    );

    expect(result.matchedRequired.map((m) => m.skillId)).toEqual(['j1', 'j2']);
  });

  it('a CV skill written twice is not counted twice (case and spaces ignored)', () => {
    const result = matchSkills(
      [cv('NestJS', X), cv('  nestjs ', X), cv('NESTJS', X)],
      [job('j1', 'NestJS', X), job('j2', 'Docker', Y)],
      0.8,
    );

    expect(result.matchedRequired).toHaveLength(1);
    expect(result.matchedRequired[0].cvSkill).toBe('NestJS');
    expect(result.missingRequired).toEqual([{ skillId: 'j2', name: 'Docker' }]);
  });

  describe('a job skill with no vector yet', () => {
    it('matches by name, ignoring case and surrounding spaces', () => {
      const result = matchSkills(
        [cv('  nestjs ', Y)],
        [job('j1', 'NestJS', null)],
        0.8,
      );

      expect(result.matchedRequired).toEqual([
        { skillId: 'j1', name: 'NestJS', cvSkill: 'nestjs', similarity: 1 },
      ]);
    });

    it('is missing when no CV skill has the same name, however close its vector is', () => {
      const result = matchSkills(
        [cv('Nest', X)],
        [job('j1', 'NestJS', null)],
        0.1,
      );

      expect(result.matchedRequired).toEqual([]);
      expect(result.missingRequired).toEqual([{ skillId: 'j1', name: 'NestJS' }]);
    });

    it('an optional one that does not match is simply not listed', () => {
      const result = matchSkills([cv('X', X)], [job('j1', 'Redis', null, false)], 0.8);

      expect(result).toEqual({
        matchedRequired: [],
        matchedOptional: [],
        missingRequired: [],
      });
    });
  });

  it('keeps the order of the job skills', () => {
    const result = matchSkills(
      [cv('a', X)],
      [job('j3', 'C', X), job('j1', 'A', X), job('j2', 'B', X)],
      0.8,
    );

    expect(result.matchedRequired.map((m) => m.skillId)).toEqual(['j3', 'j1', 'j2']);
  });
});
