import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@ats-platform/database';
import {
  assertOrganizationAccess,
  organizationScope,
  requireCallerOrganization,
  resolveWriteOrganization,
} from './tenant-caller';
import { callerOf } from '../../test-utils/unit-test-helpers';

const platformAdmin = callerOf(UserRole.admin);
const orgAdmin = callerOf(UserRole.org_admin); // 'org-1'
const recruiter = callerOf(UserRole.recruiter); // 'org-1'
const candidate = callerOf(UserRole.candidate);
const orphanRecruiter = callerOf(UserRole.recruiter, { organizationId: null });

describe('tenant-caller', () => {
  describe('organizationScope — listing an org-scoped table', () => {
    it('gives a platform admin every organization (criterion 6a)', () => {
      expect(organizationScope(platformAdmin)).toEqual({});
    });

    it.each([
      ['an org_admin', orgAdmin],
      ['a recruiter', recruiter],
    ])(
      'confines %s to its own organization (criteria 1, 6b)',
      (_who, caller) => {
        expect(organizationScope(caller)).toEqual({ organizationId: 'org-1' });
      },
    );

    it('refuses a candidate, who never lists org-scoped rows directly', () => {
      expect(() => organizationScope(candidate)).toThrow(ForbiddenException);
    });

    // E2 — fail closed: the absence of an organization must never read as "all".
    it('refuses staff with no organization instead of returning an empty filter', () => {
      expect(() => organizationScope(orphanRecruiter)).toThrow(
        'chưa được gắn với tổ chức nào',
      );
    });
  });

  describe('assertOrganizationAccess — one resource by id', () => {
    it('fully authorises a platform admin on any organization', () => {
      expect(assertOrganizationAccess(platformAdmin, 'org-2')).toBe(true);
    });

    it('fully authorises an org_admin inside its organization', () => {
      expect(assertOrganizationAccess(orgAdmin, 'org-1')).toBe(true);
    });

    it('sends a recruiter inside its organization on to the department check', () => {
      expect(assertOrganizationAccess(recruiter, 'org-1')).toBe(false);
    });

    it.each([
      ['an org_admin', orgAdmin],
      ['a recruiter', recruiter],
    ])(
      'refuses %s a resource of another organization (criterion 2)',
      (_who, caller) => {
        expect(() => assertOrganizationAccess(caller, 'org-2')).toThrow(
          'tổ chức khác',
        );
      },
    );

    it('refuses a candidate outright', () => {
      expect(() => assertOrganizationAccess(candidate, 'org-1')).toThrow(
        ForbiddenException,
      );
    });

    it('refuses staff with no organization, whatever the resource (E2)', () => {
      expect(() => assertOrganizationAccess(orphanRecruiter, 'org-1')).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('resolveWriteOrganization — a new row with no parent (criterion 7)', () => {
    it("uses an org_admin's own organization when none is named", () => {
      expect(resolveWriteOrganization(orgAdmin)).toBe('org-1');
    });

    it('accepts an org_admin naming its own organization', () => {
      expect(resolveWriteOrganization(orgAdmin, 'org-1')).toBe('org-1');
    });

    it('refuses an org_admin naming another organization', () => {
      expect(() => resolveWriteOrganization(orgAdmin, 'org-2')).toThrow(
        ForbiddenException,
      );
    });

    it('uses the organization a platform admin names', () => {
      expect(resolveWriteOrganization(platformAdmin, 'org-2')).toBe('org-2');
    });

    it.each([undefined, null, ''])(
      'refuses a platform admin that names no organization (%p)',
      (requested) => {
        expect(() =>
          resolveWriteOrganization(platformAdmin, requested),
        ).toThrow(BadRequestException);
      },
    );
  });

  it('requireCallerOrganization returns the organization or refuses', () => {
    expect(requireCallerOrganization(orgAdmin)).toBe('org-1');
    expect(() => requireCallerOrganization(platformAdmin)).toThrow(
      ForbiddenException,
    );
  });
});
