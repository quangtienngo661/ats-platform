import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@ats-platform/database';

/**
 * Who is making a request, as the tenant boundary sees it.
 *
 * Resolved once per request from the database (JwtStrategy for HTTP, the handshake
 * for Socket.IO — see resolve-tenant-caller.ts) and passed to services explicitly.
 * Deliberately one object rather than a (userId, organizationId) pair: both are
 * strings, and two adjacent strings swapped at a call site still compile.
 */
export interface TenantCaller {
  userId: string;
  role: UserRole;
  /**
   * The organization this caller acts within.
   *  - `admin` (platform administrator): always null — it belongs to no organization.
   *  - `org_admin`: its bound organization (a DB CHECK constraint guarantees one).
   *  - `recruiter`: its Recruiter record's organization, or null when it has none.
   *  - `candidate`: null — candidates are one pool shared across organizations.
   * A null for a recruiter or org_admin means NO organization-scoped access at all.
   */
  organizationId: string | null;
}

export const isPlatformAdmin = (role: string) => role === UserRole.admin;

export const isOrgAdmin = (role: string) => role === UserRole.org_admin;

/** Staff who work inside exactly one organization. */
export const isOrganizationStaff = (role: string) =>
  role === UserRole.recruiter || role === UserRole.org_admin;

const NOT_ALLOWED = 'Bạn không có quyền truy cập tài nguyên này';
const OUTSIDE_ORGANIZATION =
  'Bạn không có quyền truy cập dữ liệu của tổ chức khác';
const NO_ORGANIZATION = 'Tài khoản của bạn chưa được gắn với tổ chức nào';

/**
 * The caller's organization. Throws for a caller that has none, so a staff account
 * whose organization cannot be resolved gets nothing rather than everything
 * (module spec, edge case E2: fail closed).
 */
export function requireCallerOrganization(caller: TenantCaller): string {
  if (!caller.organizationId) {
    throw new ForbiddenException(NO_ORGANIZATION);
  }
  return caller.organizationId;
}

/**
 * `where` fragment for LISTING an org-scoped table.
 *   platform admin        → {}                  every organization (criterion 6a)
 *   recruiter / org_admin → { organizationId }  its own only (criteria 1, 6b)
 * Anyone else is refused: a candidate never lists org-scoped rows directly.
 */
export function organizationScope(caller: TenantCaller): {
  organizationId?: string;
} {
  if (isPlatformAdmin(caller.role)) return {};
  if (isOrganizationStaff(caller.role)) {
    return { organizationId: requireCallerOrganization(caller) };
  }
  throw new ForbiddenException(NOT_ALLOWED);
}

/**
 * The first step of every per-resource staff check.
 *
 *   platform admin                        → true   authorised, nothing further
 *   org_admin inside its organization     → true   it sees every department there
 *   recruiter inside its organization     → false  continue to the department check
 *   staff targeting another organization  → 403    (criterion 2)
 *   anyone else                           → 403
 *
 * For a recruiter the department check that follows already implies the
 * organization (a department belongs to exactly one). Checking the organization
 * first anyway means a row whose denormalised organizationId disagrees with its
 * department fails closed instead of being let through.
 */
export function assertOrganizationAccess(
  caller: TenantCaller,
  resourceOrganizationId: string,
): boolean {
  if (isPlatformAdmin(caller.role)) return true;
  if (!isOrganizationStaff(caller.role)) {
    throw new ForbiddenException(NOT_ALLOWED);
  }
  if (requireCallerOrganization(caller) !== resourceOrganizationId) {
    throw new ForbiddenException(OUTSIDE_ORGANIZATION);
  }
  return isOrgAdmin(caller.role);
}

/**
 * Which organization a NEW row belongs to when it has no parent row to inherit
 * one from — a Department, an AiConfig (module spec criterion 7).
 *
 *   recruiter / org_admin → its own organization; naming a different one is a 403
 *   platform admin        → must name one; it belongs to none, so nothing to infer
 *
 * The caller still has to check that a platform admin's choice exists.
 */
export function resolveWriteOrganization(
  caller: TenantCaller,
  requested?: string | null,
): string {
  if (isPlatformAdmin(caller.role)) {
    if (!requested) {
      throw new BadRequestException(
        'Quản trị viên nền tảng phải chỉ định tổ chức (organizationId)',
      );
    }
    return requested;
  }

  const own = requireCallerOrganization(caller);
  if (requested && requested !== own) {
    throw new ForbiddenException(OUTSIDE_ORGANIZATION);
  }
  return own;
}
