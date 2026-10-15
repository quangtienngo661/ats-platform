import { randomUUID } from 'node:crypto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BulkScreeningDto } from './bulk-screening.dto';

const validateBody = (body: Record<string, unknown>) =>
  validate(plainToInstance(BulkScreeningDto, body), {
    forbidUnknownValues: false,
  });

describe('BulkScreeningDto', () => {
  it('accepts an empty body (auto mode)', async () => {
    expect(await validateBody({})).toEqual([]);
  });

  it('accepts 50 distinct UUIDs', async () => {
    const applicationIds = Array.from({ length: 50 }, () => randomUUID());

    expect(await validateBody({ applicationIds })).toEqual([]);
  });

  it('rejects [], 51 ids, a duplicate and a non-UUID', async () => {
    const duplicateId = randomUUID();
    const cases = [
      { applicationIds: [], constraint: 'arrayMinSize' },
      {
        applicationIds: Array.from({ length: 51 }, () => randomUUID()),
        constraint: 'arrayMaxSize',
      },
      { applicationIds: [duplicateId, duplicateId], constraint: 'arrayUnique' },
      { applicationIds: ['not-a-uuid'], constraint: 'isUuid' },
    ];

    for (const { applicationIds, constraint } of cases) {
      const errors = await validateBody({ applicationIds });
      const error = errors.find(({ property }) => property === 'applicationIds');

      expect(error?.constraints ?? {}).toHaveProperty(constraint);
    }
  });

  it('rejects a non-boolean flag and a non-UUID configId', async () => {
    const errors = await validateBody({
      moveAppliedToScreening: 'true',
      configId: 'not-a-uuid',
    });
    const flagError = errors.find(
      ({ property }) => property === 'moveAppliedToScreening',
    );
    const configError = errors.find(({ property }) => property === 'configId');

    expect(flagError?.constraints ?? {}).toHaveProperty('isBoolean');
    expect(configError?.constraints ?? {}).toHaveProperty('isUuid');
  });
});
