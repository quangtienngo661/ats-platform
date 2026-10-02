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
