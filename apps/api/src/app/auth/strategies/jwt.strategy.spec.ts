import { UserRole, UserStatus } from '@ats-platform/types';
import { JwtStrategy } from './jwt.strategy';
import { createPrismaMock } from '../../../test-utils/unit-test-helpers';

describe('JwtStrategy', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let strategy: JwtStrategy;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    prisma = createPrismaMock();
    strategy = new JwtStrategy(prisma as any);
  });

  it('sources role and fullName from the DB, not from the token payload', async () => {
    prisma.user.findUnique.mockResolvedValue({
      userId: 'user-1',
      role: UserRole.candidate,
      fullName: 'Alice',
      status: UserStatus.active,
    });

    // A token minted while this user was still an admin must not grant admin now.
    await expect(
      strategy.validate({ userId: 'user-1', role: UserRole.admin } as any),
    ).resolves.toEqual({
      userId: 'user-1',
      role: UserRole.candidate,
      fullName: 'Alice',
    });
  });

  it('rejects a token belonging to a deactivated account', async () => {
    prisma.user.findUnique.mockResolvedValue({
      userId: 'user-1',
      role: UserRole.candidate,
      fullName: 'Alice',
      status: UserStatus.inactive,
    });

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
