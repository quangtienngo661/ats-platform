// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { parseJobFilterParams } from './job-filter-params';

describe('parseJobFilterParams — what the job search takes from the URL (RF3, RF5)', () => {
  it('has nothing to filter by when the URL has none of the new parameters', () => {
    expect(parseJobFilterParams({})).toEqual({});
  });

  it('reads whole-number salaries, and a ceiling of 0 as a value', () => {
    expect(parseJobFilterParams({ salaryMin: '12000000', salaryMax: '16000000' })).toEqual({ salaryMin: 12_000_000, salaryMax: 16_000_000 });
    expect(parseJobFilterParams({ salaryMax: '0' })).toEqual({ salaryMax: 0 });
  });

  it.each([
    ['empty', ''],
    ['letters', 'abc'],
    ['negative', '-1'],
    ['decimal', '1.5'],
    ['too large to hold exactly', '99999999999999999999'],
    ['repeated', ['1', '2']],
  ])('drops a %s salary instead of passing it to the API', (_case, salaryMin) => {
    expect(parseJobFilterParams({ salaryMin })).toEqual({});
  });

  it('drops both ends when the minimum is above the maximum', () => {
    expect(parseJobFilterParams({ salaryMin: '20000000', salaryMax: '10000000', skillIds: randomUUID() })).toEqual({
      skillIds: expect.any(Array),
    });
  });

  it('keeps a range that is a single value', () => {
    expect(parseJobFilterParams({ salaryMin: '15000000', salaryMax: '15000000' })).toEqual({
      salaryMin: 15_000_000, salaryMax: 15_000_000,
    });
  });

  it('turns one skill id into a list and keeps a repeated key as a list', () => {
    const [first, second] = [randomUUID(), randomUUID()];
    expect(parseJobFilterParams({ skillIds: first })).toEqual({ skillIds: [first] });
    expect(parseJobFilterParams({ skillIds: [first, second] })).toEqual({ skillIds: [first, second] });
  });

  it('drops what is not a UUID, and repeats', () => {
    const id = randomUUID();
    expect(parseJobFilterParams({ skillIds: ['khong-phai-uuid', id, id] })).toEqual({ skillIds: [id] });
    expect(parseJobFilterParams({ skillIds: 'khong-phai-uuid' })).toEqual({});
  });

  it('keeps the first 20 skills, the most the API accepts', () => {
    const ids = Array.from({ length: 25 }, () => randomUUID());
    expect(parseJobFilterParams({ skillIds: ids }).skillIds).toEqual(ids.slice(0, 20));
  });
});
