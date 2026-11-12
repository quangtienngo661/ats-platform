import { ExecutionContext, ForbiddenException, RequestMethod } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@ats-platform/database';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { callerOf } from '../../../test-utils/unit-test-helpers';
import { InterviewQuestionsController } from './interview-questions.controller';

describe('InterviewQuestionsController (C10)', () => {
  const service = {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const controller = new InterviewQuestionsController(service as never);
  const admin = callerOf(UserRole.admin, { userId: 'admin-1' });

  beforeEach(() => jest.resetAllMocks());

  it('delegates each route to the service', async () => {
    const dto = { difficulty: 'easy', questionText: 'Q', expectedPoints: ['p'] } as never;

    await controller.list('topic-1', { page: 1 });
    await controller.create(admin, 'topic-1', dto);
    await controller.update('q-1', { isActive: false });
    await controller.remove('q-1');

    expect(service.list).toHaveBeenCalledWith('topic-1', { page: 1 });
    expect(service.create).toHaveBeenCalledWith('topic-1', dto, 'admin-1');
    expect(service.update).toHaveBeenCalledWith('q-1', { isActive: false });
    expect(service.remove).toHaveBeenCalledWith('q-1');
  });

  it.each([
    ['list', 'topics/:topicId/questions', RequestMethod.GET],
    ['create', 'topics/:topicId/questions', RequestMethod.POST],
    ['update', 'questions/:questionId', RequestMethod.PATCH],
    ['remove', 'questions/:questionId', RequestMethod.DELETE],
  ] as const)('%s is %s', (handler, path, method) => {
    const fn = InterviewQuestionsController.prototype[handler];

    expect(Reflect.getMetadata('path', InterviewQuestionsController)).toBe('interviews');
    expect(Reflect.getMetadata('path', fn)).toBe(path);
    expect(Reflect.getMetadata('method', fn)).toBe(method);
  });

  describe('RolesGuard in front of every route (non-admin → 403)', () => {
    const guard = new RolesGuard(new Reflector());
    const contextFor = (handler: keyof InterviewQuestionsController, role: UserRole) =>
      ({
        getHandler: () => InterviewQuestionsController.prototype[handler],
        getClass: () => InterviewQuestionsController,
        switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
      }) as unknown as ExecutionContext;
    const handlers = ['list', 'create', 'update', 'remove'] as const;

    it.each(handlers)('%s lets the platform admin through', (handler) => {
      expect(guard.canActivate(contextFor(handler, UserRole.admin))).toBe(true);
    });

    it.each(
      handlers.flatMap((h) =>
        [UserRole.org_admin, UserRole.recruiter, UserRole.candidate].map((r) => [h, r] as const),
      ),
    )('%s refuses %s with 403', (handler, role) => {
      expect(() => guard.canActivate(contextFor(handler, role))).toThrow(ForbiddenException);
    });
  });
});
