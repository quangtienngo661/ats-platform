import { ScorecardRecommendation } from '@ats-platform/database';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpsertScorecardDto } from './upsert-scorecard.dto';

const base = {
  technicalSkills: 3,
  problemSolving: 3,
  communication: 3,
  cultureFit: 3,
  recommendation: ScorecardRecommendation.yes,
};

const validationErrors = (payload: Record<string, unknown>) =>
  validate(plainToInstance(UpsertScorecardDto, payload));

describe('UpsertScorecardDto', () => {
  it('accepts 1 and 5', async () => {
    for (const score of [1, 5]) {
      await expect(validationErrors({
        ...base,
        technicalSkills: score,
        problemSolving: score,
        communication: score,
        cultureFit: score,
      })).resolves.toEqual([]);
    }
  });

  it.each([
    { field: 'technicalSkills', value: 0, constraint: 'min' },
    { field: 'technicalSkills', value: 6, constraint: 'max' },
    { field: 'technicalSkills', value: 3.5, constraint: 'isInt' },
    { field: 'technicalSkills', value: undefined, constraint: 'isInt' },
    { field: 'problemSolving', value: undefined, constraint: 'isInt' },
    { field: 'communication', value: undefined, constraint: 'isInt' },
    { field: 'cultureFit', value: undefined, constraint: 'isInt' },
  ])('rejects 0, 6, 3.5 and missing', async ({ field, value, constraint }) => {
    const payload: Record<string, unknown> = { ...base };
    if (value === undefined) {
      delete payload[field];
    } else {
      payload[field] = value;
    }

    const errors = await validationErrors(payload);

    expect(errors).toEqual([
      expect.objectContaining({
        property: field,
        constraints: expect.objectContaining({ [constraint]: expect.any(String) }),
      }),
    ]);
  });

  it('accepts a 2000-character comment and rejects 2001', async () => {
    await expect(validationErrors({ ...base, comment: 'a'.repeat(2000) })).resolves.toEqual([]);

    const errors = await validationErrors({ ...base, comment: 'a'.repeat(2001) });

    expect(errors).toEqual([
      expect.objectContaining({
        property: 'comment',
        constraints: expect.objectContaining({ maxLength: expect.any(String) }),
      }),
    ]);
  });

  it('rejects an unknown recommendation', async () => {
    const errors = await validationErrors({ ...base, recommendation: 'maybe' });

    expect(errors).toEqual([
      expect.objectContaining({
        property: 'recommendation',
        constraints: expect.objectContaining({ isEnum: expect.any(String) }),
      }),
    ]);
  });
});
