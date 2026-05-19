import { CvScreeningsController } from './cv-screenings.controller';
import { mockRequest } from '../../test-utils/unit-test-helpers';

describe('CvScreeningsController', () => {
  it('delegates stats and screening result endpoints', async () => {
    const service = {
      getScreeningStats: jest.fn(),
      getScreeningResultForCandidate: jest.fn(),
      getScreeningResult: jest.fn(),
    };
    const controller = new CvScreeningsController(service as any);
    const req = mockRequest({ userId: 'user-1' });

    await controller.getScreeningStats('job-1');
    await controller.getScreeningResultForCandidate(req, 'app-1');
    await controller.getScreeningResult('app-1');

    expect(service.getScreeningStats).toHaveBeenCalledWith('job-1');
    expect(service.getScreeningResultForCandidate).toHaveBeenCalledWith('app-1', 'user-1');
    expect(service.getScreeningResult).toHaveBeenCalledWith('app-1');
  });
});
