import { randomUUID } from 'node:crypto';
import { ValidationPipe } from '@nestjs/common';
import { FindJobPostingsQueryDto } from './job-posting.dto';

describe('job posting query validation', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  const parse = (query: Record<string, string>) => pipe.transform(query, {
    type: 'query', metatype: FindJobPostingsQueryDto,
  });

  it.each(['onsite', 'remote', 'hybrid'])('accepts the %s filter and numeric pagination', async (locationType) => {
    await expect(parse({ locationType, page: '2', limit: '10' })).resolves.toMatchObject({ locationType, page: 2, limit: 10 });
  });

  it('rejects an unsupported location type', async () => {
    await expect(parse({ locationType: 'anywhere' })).rejects.toMatchObject({ status: 400 });
  });

  it.each(['0', '-1', '1.5', '2abc', '', 'Infinity'])('rejects page %j before querying', async (page) => {
    await expect(parse({ page })).rejects.toMatchObject({ status: 400 });
  });
});

describe('job posting query validation — salary and skills (C10, E15, E16)', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  const parse = (query: Record<string, string | string[]>) => pipe.transform(query, {
    type: 'query', metatype: FindJobPostingsQueryDto,
  }) as Promise<FindJobPostingsQueryDto>;

  it('reads salaries as numbers', async () => {
    await expect(parse({ salaryMin: '15000000', salaryMax: '15000000' })).resolves.toMatchObject({
      salaryMin: 15_000_000, salaryMax: 15_000_000,
    });
  });

  it('accepts a ceiling of 0', async () => {
    await expect(parse({ salaryMax: '0' })).resolves.toMatchObject({ salaryMax: 0 });
  });

  it.each(['', '   '])('treats an empty salary %j as no filter, not as 0', async (blank) => {
    const query = await parse({ salaryMin: blank, salaryMax: blank });
    expect(query.salaryMin).toBeUndefined();
    expect(query.salaryMax).toBeUndefined();
  });

  it.each(['-1', 'abc', 'Infinity'])('rejects salary %j', async (salaryMin) => {
    await expect(parse({ salaryMin })).rejects.toMatchObject({ status: 400 });
  });

  it('turns a single skill id into a list', async () => {
    const id = randomUUID();
    await expect(parse({ skillIds: id })).resolves.toMatchObject({ skillIds: [id] });
  });

  it('keeps a repeated skillIds key as a list', async () => {
    const ids = [randomUUID(), randomUUID()];
    await expect(parse({ skillIds: ids })).resolves.toMatchObject({ skillIds: ids });
  });

  it('rejects a skill id that is not a UUID', async () => {
    await expect(parse({ skillIds: 'khong-phai-uuid' })).rejects.toMatchObject({ status: 400 });
  });

  it('accepts 20 skills and rejects 21', async () => {
    const ids = (count: number) => Array.from({ length: count }, () => randomUUID());
    await expect(parse({ skillIds: ids(20) })).resolves.toBeDefined();
    await expect(parse({ skillIds: ids(21) })).rejects.toMatchObject({ status: 400 });
  });

  it('gives the same result when the transforms run a second time', async () => {
    // main.ts has no `transform: true`, so Nest returns classToPlain(entity) and every
    // @Transform runs again on its own output.
    const once = await parse({ salaryMin: '12000000', skillIds: randomUUID() });
    const twice = await parse(once as unknown as Record<string, string>);
    expect(twice).toEqual(once);
  });
});
