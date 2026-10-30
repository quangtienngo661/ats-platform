import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReviewScreeningDto } from './review-screening.dto';

const base = { skillsScore: 80, experienceScore: 70, educationScore: 60 };

const validationErrors = (payload: Record<string, unknown>) =>
  validate(plainToInstance(ReviewScreeningDto, payload), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

describe('ReviewScreeningDto', () => {
  it.each([0, 100, 72.55, 50])('accepts a score of %s', async (score) => {
    await expect(
      validationErrors({
        skillsScore: score,
        experienceScore: score,
        educationScore: score,
      }),
    ).resolves.toEqual([]);
  });

  it('accepts a note, and works without one', async () => {
    await expect(validationErrors(base)).resolves.toEqual([]);
    await expect(
      validationErrors({ ...base, note: 'Đã xem lại hồ sơ' }),
    ).resolves.toEqual([]);
  });

  it.each([
    { field: 'skillsScore', value: 101, constraint: 'max' },
    { field: 'experienceScore', value: 100.1, constraint: 'max' },
    { field: 'educationScore', value: -1, constraint: 'min' },
    { field: 'skillsScore', value: -0.1, constraint: 'min' },
    { field: 'skillsScore', value: '80', constraint: 'isNumber' },
    { field: 'experienceScore', value: null, constraint: 'isNumber' },
    { field: 'educationScore', value: Number.NaN, constraint: 'isNumber' },
    { field: 'note', value: 123, constraint: 'isString' },
    { field: 'note', value: 'a'.repeat(1001), constraint: 'maxLength' },
  ])('rejects $field = $value with $constraint', async ({ field, value, constraint }) => {
    const errors = await validationErrors({ ...base, [field]: value });

    expect(errors).toEqual([
      expect.objectContaining({
        property: field,
        constraints: expect.objectContaining({ [constraint]: expect.any(String) }),
      }),
    ]);
  });

  it.each(['skillsScore', 'experienceScore', 'educationScore'])(
    'rejects a missing %s',
    async (field) => {
      const payload: Record<string, unknown> = { ...base };
      delete payload[field];

      const errors = await validationErrors(payload);

      expect(errors).toEqual([expect.objectContaining({ property: field })]);
    },
  );

  it('rejects fields it does not know (the client cannot set the reviewer or the overall score)', async () => {
    const errors = await validationErrors({
      ...base,
      reviewedById: 'someone-else',
      overallScore: 99,
    });

    expect(errors.map((e) => e.property).sort()).toEqual([
      'overallScore',
      'reviewedById',
    ]);
  });
});
