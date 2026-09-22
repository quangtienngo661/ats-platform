import { UserRole, UserStatus } from '@ats-platform/database';
import { PrismaService } from '../prisma/prisma.service';
import { TenantCaller } from './tenant-caller';

export interface ResolvedCaller extends TenantCaller {
  fullName: string;
  status: UserStatus;
}

/**
 * Load the caller from the database, organization included — the ONE place both
 * JwtStrategy (HTTP) and the Socket.IO handshake go through, so the two transports
 * cannot disagree about which organization a user belongs to.
 *
 * Read on every request rather than trusted from the token, for the same reason
 * role and status already were: a token minted before a user changed organization
 * must not keep granting the old one until it expires.
 */
export async function resolveTenantCaller(
  prisma: Pick<PrismaService, 'user'>,
  userId: string,
): Promise<ResolvedCaller | null> {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: {
      userId: true,
      role: true,
      fullName: true,
      status: true,
      organizationId: true,
      recruiter: { select: { organizationId: true } },
    },
  });

  if (!user) return null;

  return {
    userId: user.userId,
    role: user.role,
    fullName: user.fullName,
    status: user.status,
    organizationId: organizationOf(user),
  };
}

function organizationOf(user: {
  role: UserRole;
  organizationId: string | null;
  recruiter: { organizationId: string } | null;
}): string | null {
  switch (user.role) {
    case UserRole.org_admin:
      return user.organizationId;
    case UserRole.recruiter:
      return user.recruiter?.organizationId ?? null;
    default:
      // Platform admins belong to no organization; candidates are a shared pool.
      return null;
  }
}
