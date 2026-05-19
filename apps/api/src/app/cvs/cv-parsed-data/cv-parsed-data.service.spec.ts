import { CvParsedDataService } from './cv-parsed-data.service';
import { createPrismaMock } from '../../../test-utils/unit-test-helpers';

describe('CvParsedDataService', () => {
  it('maps parsed CV fields into Prisma create data', async () => {
    const prisma = createPrismaMock();
    prisma.cVParsedData.create.mockResolvedValue({ parsedDataId: 'parsed-1' });
    const service = new CvParsedDataService(prisma as any);

    await service.create('cv-1', {
      summary: 'Senior backend developer',
      location: 'HCM',
      skills: ['nestjs'],
      experience: [],
      education: [],
      projects: [],
      certificates: [],
    });

    expect(prisma.cVParsedData.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cvId: 'cv-1',
          summary: 'Senior backend developer',
          skills: ['nestjs'],
        }),
        omit: { cvId: true },
      }),
    );
  });
});
