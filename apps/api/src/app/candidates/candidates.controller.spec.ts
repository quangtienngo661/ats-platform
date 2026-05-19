import { CandidatesController } from './candidates.controller';
import { mockRequest } from '../../test-utils/unit-test-helpers';

describe('CandidatesController', () => {
  it('uses req.user for candidate self-service endpoints', () => {
    const service = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
    };
    const controller = new CandidatesController(service as any);
    const req = mockRequest({ userId: 'user-1' });

    controller.getProfile(req);
    controller.updateProfile(req, { currentTitle: 'Backend' } as any);
    controller.findOne('cand-1');
    controller.findAll({ search: 'alice' } as any);

    expect(service.getProfile).toHaveBeenCalledWith('user-1');
    expect(service.updateProfile).toHaveBeenCalledWith('user-1', { currentTitle: 'Backend' });
    expect(service.findOne).toHaveBeenCalledWith('cand-1');
    expect(service.findAll).toHaveBeenCalledWith({ search: 'alice' });
  });
});
