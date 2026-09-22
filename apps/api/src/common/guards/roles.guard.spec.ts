import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@ats-platform/database';
import { grantedRoles, RolesGuard } from './roles.guard';

const contextFor = (role: UserRole) =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
  }) as any;

describe('RolesGuard', () => {
  const guardRequiring = (required: UserRole[] | undefined) => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(required),
    };
    return new RolesGuard(reflector as unknown as Reflector);
  };

  it('lets anyone through a route with no @Roles', () => {
    expect(
      guardRequiring(undefined).canActivate(contextFor(UserRole.candidate)),
    ).toBe(true);
  });

  it('lets the platform admin through any route', () => {
    expect(
      guardRequiring([UserRole.candidate]).canActivate(
        contextFor(UserRole.admin),
      ),
    ).toBe(true);
  });

  // roles.guard.ts:22 is the "admin sees everything" bypass. It must stay the
  // platform admin's alone — an org_admin is not a platform administrator.
  it("does NOT give an org_admin the platform admin's bypass", () => {
    expect(() =>
      guardRequiring([UserRole.admin]).canActivate(
        contextFor(UserRole.org_admin),
      ),
    ).toThrow(ForbiddenException);
    expect(() =>
      guardRequiring([UserRole.candidate]).canActivate(
        contextFor(UserRole.org_admin),
      ),
    ).toThrow(ForbiddenException);
  });

  // org_admin ──▷ recruiter: every recruiter route admits an org_admin; the
  // services then confine it to its own organization.
  it('admits an org_admin wherever a recruiter is admitted', () => {
    expect(
      guardRequiring([UserRole.recruiter]).canActivate(
        contextFor(UserRole.org_admin),
      ),
    ).toBe(true);
  });

  it('admits an org_admin on routes that name it', () => {
    expect(
      guardRequiring([UserRole.admin, UserRole.org_admin]).canActivate(
        contextFor(UserRole.org_admin),
      ),
    ).toBe(true);
  });

  // The generalization runs one way only: a recruiter does not inherit the
  // org_admin's administration routes.
  it('does not admit a recruiter to an org_admin route', () => {
    expect(() =>
      guardRequiring([UserRole.admin, UserRole.org_admin]).canActivate(
        contextFor(UserRole.recruiter),
      ),
    ).toThrow(ForbiddenException);
  });

  it('grantedRoles expands only the org_admin', () => {
    expect(grantedRoles(UserRole.org_admin)).toEqual([
      UserRole.org_admin,
      UserRole.recruiter,
    ]);
    expect(grantedRoles(UserRole.recruiter)).toEqual([UserRole.recruiter]);
    expect(grantedRoles(UserRole.candidate)).toEqual([UserRole.candidate]);
  });
});
