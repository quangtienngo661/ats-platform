import { UserRole } from '@ats-platform/database';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { callerOf } from '../../test-utils/unit-test-helpers';
import { AnalyticsController } from './analytics.controller';

const rolesOf = (method: keyof AnalyticsController) =>
  Reflect.getMetadata(ROLES_KEY, AnalyticsController.prototype[method]);

describe('AnalyticsController', () => {
  it('passes the caller and the query to the service', async () => {
    const service = {
      recruitment: jest.fn(),
      aiCost: jest.fn(),
      modelPrices: jest.fn(),
      setModelPrice: jest.fn(),
    };
    const controller = new AnalyticsController(service as any);
    const caller = callerOf(UserRole.admin);

    controller.recruitment(caller, { jobId: 'j' });
    controller.aiCost(caller, { organizationId: 'o' });
    controller.modelPrices();
    controller.setModelPrice(caller, 'model-a', { inputUsdPerMillion: 1, outputUsdPerMillion: 2 });

    expect(service.recruitment).toHaveBeenCalledWith(caller, { jobId: 'j' });
    expect(service.aiCost).toHaveBeenCalledWith(caller, { organizationId: 'o' });
    expect(service.setModelPrice).toHaveBeenCalledWith(caller, 'model-a', { inputUsdPerMillion: 1, outputUsdPerMillion: 2 });
  });

  it('who may call what: staff see recruitment, org_admin and admin the cost, only admin the prices', () => {
    expect(rolesOf('recruitment')).toEqual([UserRole.recruiter, UserRole.admin]);
    expect(rolesOf('aiCost')).toEqual([UserRole.org_admin, UserRole.admin]);
    expect(rolesOf('modelPrices')).toEqual([UserRole.admin]);
    expect(rolesOf('setModelPrice')).toEqual([UserRole.admin]);
  });
});
