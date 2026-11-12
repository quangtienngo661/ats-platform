import { ExecutionContext, ForbiddenException, RequestMethod } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@ats-platform/database';
import { RolesGuard } from '../guards/roles.guard';
import { EmbeddingBackfillController } from './embedding-backfill.controller';

describe('EmbeddingBackfillController', () => {
  it('POST /embeddings/backfill returns how many rows were enqueued', async () => {
    const service = { enqueueMissing: jest.fn().mockResolvedValue(7) };
    const controller = new EmbeddingBackfillController(service as never);

    await expect(controller.backfill()).resolves.toEqual({ enqueued: 7 });
    expect(service.enqueueMissing).toHaveBeenCalledTimes(1);
  });

  it('is routed as POST embeddings/backfill', () => {
    expect(Reflect.getMetadata('path', EmbeddingBackfillController)).toBe('embeddings');
    expect(
      Reflect.getMetadata('path', EmbeddingBackfillController.prototype.backfill),
    ).toBe('backfill');
    expect(
      Reflect.getMetadata('method', EmbeddingBackfillController.prototype.backfill),
    ).toBe(RequestMethod.POST);
  });

  describe('RolesGuard in front of it (non-admin → 403)', () => {
    const guard = new RolesGuard(new Reflector());
    const contextFor = (role: UserRole) =>
      ({
        getHandler: () => EmbeddingBackfillController.prototype.backfill,
        getClass: () => EmbeddingBackfillController,
        switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
      }) as unknown as ExecutionContext;

    it('lets the platform admin through', () => {
      expect(guard.canActivate(contextFor(UserRole.admin))).toBe(true);
    });

    it.each([UserRole.org_admin, UserRole.recruiter, UserRole.candidate])(
      'refuses %s with 403',
      (role) => {
        expect(() => guard.canActivate(contextFor(role))).toThrow(
          ForbiddenException,
        );
      },
    );
  });
});
