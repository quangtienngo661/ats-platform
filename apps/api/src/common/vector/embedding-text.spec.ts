import { buildEmbeddingText } from './embedding-text';

describe('buildEmbeddingText', () => {
  describe('skill', () => {
    it('joins the name and its synonyms', () => {
      expect(
        buildEmbeddingText('skill', {
          name: 'React',
          synonyms: ['ReactJS', 'React.js'],
        }),
      ).toBe('React; ReactJS; React.js');
    });

    it.each([null, undefined, [], 'not an array', { a: 1 }])(
      'is just the name when synonyms is %p',
      (synonyms) => {
        expect(buildEmbeddingText('skill', { name: 'React', synonyms })).toBe(
          'React',
        );
      },
    );

    it('drops blank and non-string synonyms and a synonym equal to the name', () => {
      expect(
        buildEmbeddingText('skill', {
          name: 'React',
          synonyms: ['  ', 3, null, 'ReactJS', 'React'],
        }),
      ).toBe('React; ReactJS');
    });

    it('is null for a skill with no name', () => {
      expect(
        buildEmbeddingText('skill', { name: '  ', synonyms: ['x'] }),
      ).toBeNull();
    });
  });

  describe('cv_parsed_data', () => {
    it('combines the summary, the technical skills and the job titles', () => {
      expect(
        buildEmbeddingText('cv_parsed_data', {
          summary: 'S',
          skills: { technical: ['NestJS'] },
          experience: [{ position: 'Backend Developer' }],
        }),
      ).toBe('S\nSkills: NestJS\nPositions: Backend Developer');
    });

    it('lists several skills and positions and skips the ones without a title', () => {
      expect(
        buildEmbeddingText('cv_parsed_data', {
          summary: null,
          skills: { technical: ['NestJS', 'SQL'] },
          experience: [
            { position: 'Dev' },
            { company: 'X' },
            { position: '' },
            { position: 'Lead' },
          ],
        }),
      ).toBe('Skills: NestJS; SQL\nPositions: Dev; Lead');
    });

    it('accepts technical skills written as one comma-separated string', () => {
      expect(
        buildEmbeddingText('cv_parsed_data', {
          summary: 'S',
          skills: { technical: 'NestJS, SQL ;Docker' },
          experience: null,
        }),
      ).toBe('S\nSkills: NestJS; SQL; Docker');
    });

    it('is null when every field is empty', () => {
      expect(
        buildEmbeddingText('cv_parsed_data', {
          summary: '  ',
          skills: { technical: [] },
          experience: [],
        }),
      ).toBeNull();
      expect(
        buildEmbeddingText('cv_parsed_data', {
          summary: null,
          skills: null,
          experience: null,
        }),
      ).toBeNull();
      expect(buildEmbeddingText('cv_parsed_data', {})).toBeNull();
    });

    it('survives skills that are not an object', () => {
      expect(
        buildEmbeddingText('cv_parsed_data', {
          summary: 'S',
          skills: ['NestJS'],
          experience: 'x',
        }),
      ).toBe('S');
    });
  });

  describe('interview_question', () => {
    it('is the question text, trimmed', () => {
      expect(
        buildEmbeddingText('interview_question', {
          questionText: '  REST là gì?  ',
          expectedPoints: ['Stateless'],
        }),
      ).toBe('REST là gì?');
    });

    it.each([{}, { questionText: '' }, { questionText: '   ' }, { questionText: 5 }])(
      'is null for %p',
      (row) => {
        expect(buildEmbeddingText('interview_question', row)).toBeNull();
      },
    );
  });

  it('refuses a target it does not know', () => {
    expect(() => buildEmbeddingText('nope' as never, {})).toThrow(
      'Unknown embedding target',
    );
  });
});
