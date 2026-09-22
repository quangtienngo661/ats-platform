import { UserRole, UserStatus } from '@ats-platform/types';
import { JwtStrategy } from './jwt.strategy';
import { createPrismaMock } from '../../../test-utils/unit-test-helpers';

const dbUser = (overrides: Record<string, unknown> = {}) => ({
  userId: 'user-1',
  role: UserRole.candidate,
  fullName: 'Alice',
  status: UserStatus.active,
  organizationId: null,
  recruiter: null,
  ...overrides,
});

describe('JwtStrategy', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let strategy: JwtStrategy;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    prisma = createPrismaMock();
    strategy = new JwtStrategy(prisma as any);
  });

  it('sources role and fullName from the DB, not from the token payload', async () => {
    prisma.user.findUnique.mockResolvedValue(dbUser());

    // A token minted while this user was still an admin must not grant admin now.
    await expect(
      strategy.validate({ userId: 'user-1', role: UserRole.admin } as any),
    ).resolves.toEqual({
      userId: 'user-1',
      role: UserRole.candidate,
      fullName: 'Alice',
      organizationId: null,
    });
  });

  describe("resolves the caller's organization from the database", () => {
    it("takes a recruiter's organization from its Recruiter record", async () => {
      prisma.user.findUnique.mockResolvedValue(
        dbUser({
          role: UserRole.recruiter,
          recruiter: { organizationId: 'org-1' },
        }),
      );

      await expect(
        strategy.validate({ userId: 'user-1' }),
      ).resolves.toMatchObject({
        role: UserRole.recruiter,
        organizationId: 'org-1',
      });
    });

    it("takes an org_admin's organization from its own binding", async () => {
      prisma.user.findUnique.mockResolvedValue(
        dbUser({ role: UserRole.org_admin, organizationId: 'org-2' }),
      );

      await expect(
        strategy.validate({ userId: 'user-1' }),
      ).resolves.toMatchObject({
        role: UserRole.org_admin,
        organizationId: 'org-2',
      });
    });

    // A platform admin belongs to no organization — a stray column value must not
    // turn it into a member of one.
    it('gives a platform admin no organization', async () => {
      prisma.user.findUnique.mockResolvedValue(
        dbUser({ role: UserRole.admin, organizationId: 'org-1' }),
      );

      await expect(
        strategy.validate({ userId: 'user-1' }),
      ).resolves.toMatchObject({
        role: UserRole.admin,
        organizationId: null,
      });
    });

    // E2: no resolvable organization means no organization-scoped access; the
    // services refuse on a null, so the null must reach them rather than a guess.
    it('gives a recruiter without a Recruiter record no organization', async () => {
      prisma.user.findUnique.mockResolvedValue(
        dbUser({ role: UserRole.recruiter, recruiter: null }),
      );

      await expect(
        strategy.validate({ userId: 'user-1' }),
      ).resolves.toMatchObject({
        organizationId: null,
      });
    });

    it('reads the organization fresh on every request, never from the token', async () => {
      prisma.user.findUnique.mockResolvedValue(
        dbUser({
          role: UserRole.recruiter,
          recruiter: { organizationId: 'org-new' },
        }),
      );

      await expect(
        strategy.validate({
          userId: 'user-1',
          organizationId: 'org-old',
        } as any),
      ).resolves.toMatchObject({ organizationId: 'org-new' });
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          select: expect.objectContaining({
            organizationId: true,
            recruiter: { select: { organizationId: true } },
          }),
        }),
      );
    });
  });

  it('rejects a token belonging to a deactivated account', async () => {
    prisma.user.findUnique.mockResolvedValue(
      dbUser({ status: UserStatus.inactive }),
    );

    await expect(strategy.validate({ userId: 'user-1' })).rejects.toThrow(
      'vô hiệu hóa',
    );
  });

  it('rejects a token whose user no longer exists', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(strategy.validate({ userId: 'ghost' })).rejects.toThrow(
      'Token không hợp lệ',
    );
  });

  it('rejects a payload with no userId', async () => {
    await expect(strategy.validate({})).rejects.toThrow('Token không hợp lệ');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
