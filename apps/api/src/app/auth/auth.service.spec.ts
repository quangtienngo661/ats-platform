import * as bcrypt from 'bcrypt';
import { UserRole } from '@ats-platform/database';
import { AuthService } from './auth.service';
import {
  createJwtMock,
  createPrismaMock,
  createPrismaTransactionMock,
  createQueueMock,
  createRedisMock,
  mockRequest,
  mockResponse,
} from '../../test-utils/unit-test-helpers';

jest.mock('bcrypt', () => ({
  hashSync: jest.fn(),
  compareSync: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let jwt: ReturnType<typeof createJwtMock>;
  let redis: ReturnType<typeof createRedisMock>;
  let queue: ReturnType<typeof createQueueMock>;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    prisma = createPrismaMock();
    jwt = createJwtMock();
    redis = createRedisMock();
    queue = createQueueMock();
    service = new AuthService(prisma as any, jwt as any, redis as any, queue as any);
    (bcrypt.hashSync as jest.Mock).mockReturnValue('hashed');
    (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('logs in verified users and stores a hashed refresh token', async () => {
    prisma.user.findUnique.mockResolvedValue({
      userId: 'user-1',
      email: 'a@test.com',
      passwordHash: 'hash',
      emailVerified: true,
      role: UserRole.candidate,
      fullName: 'Alice',
    });
    jwt.signAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh');
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

    await expect(service.login({ email: 'a@test.com', password: 'secret' })).resolves.toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
      refreshTokenId: 'rt-1',
    });

    expect(prisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1', tokenHash: 'hashed', revoked: false }),
      }),
    );
  });

  it('rejects bad credentials and unverified emails', async () => {
    await expect(service.login({ email: '', password: '' })).rejects.toThrow('email');

    prisma.user.findUnique.mockResolvedValue({ passwordHash: 'hash', emailVerified: false, email: 'a@test.com' });
    await expect(service.login({ email: 'a@test.com', password: 'secret' })).rejects.toThrow('EMAIL_NOT_VERIFIED');
  });

  it('registers a new candidate user and queues verification email', async () => {
    const tx = createPrismaTransactionMock();
    prisma.user.findUnique.mockResolvedValue(null);
    tx.user.create.mockResolvedValue({ userId: 'user-1', email: 'a@test.com' });
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));

    await expect(
      service.register({ email: 'a@test.com', password: 'secret', fullName: 'Alice' }),
    ).resolves.toEqual({ userId: 'user-1', email: 'a@test.com' });

    expect(tx.candidate.create).toHaveBeenCalledWith({ data: { userId: 'user-1' } });
    expect(queue.add).toHaveBeenCalledWith(
      'send-register-verification-email',
      expect.objectContaining({ email: 'a@test.com', link: expect.stringContaining('/auth/verify-email') }),
      expect.any(Object),
    );
  });

  it('verifies email tokens and cleans Redis keys', async () => {
    redis.get.mockResolvedValue('user-1');
    prisma.user.findUnique.mockResolvedValue({ userId: 'user-1', emailVerified: false });
    prisma.user.update.mockResolvedValue({ userId: 'user-1', emailVerified: true });

    await expect(service.verifyEmail('token', 'verify')).resolves.toEqual(
      expect.objectContaining({ redirectUrl: expect.stringContaining('verification-success') }),
    );

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { emailVerified: true },
    });
    expect(redis.del).toHaveBeenCalledTimes(2);
  });

  it('rotates a valid refresh token and sets the new cookie', async () => {
    jwt.verifyAsync.mockResolvedValue({ userId: 'user-1', role: 'candidate', fullName: 'Alice' });
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-1',
      tokenHash: 'hash',
      revoked: false,
      expiresAt: new Date(Date.now() + 60_000),
    });
    jwt.signAsync.mockResolvedValueOnce('new-access').mockResolvedValueOnce('new-refresh');
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt-2' });
    const res = mockResponse();

    await expect(
      service.refreshToken(mockRequest({}, { refreshToken: 'rt-1.old-refresh' }), res),
    ).resolves.toBe('new-access');

    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'rt-1' },
      data: { revoked: true },
    });
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'rt-2.new-refresh', expect.any(Object));
  });

  it('logs out by revoking a matching token and clearing the cookie', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({ id: 'rt-1', tokenHash: 'hash', revoked: false });
    const res = mockResponse();

    await service.logout(mockRequest({}, { refreshToken: 'rt-1.token' }), res);

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { id: 'rt-1', revoked: false },
      data: { revoked: true },
    });
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
  });

  it('resets password and revokes all refresh tokens for the user', async () => {
    const tx = createPrismaTransactionMock();
    redis.get.mockResolvedValue('user-1');
    prisma.user.findUnique.mockResolvedValue({ userId: 'user-1' });
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));
    const res = mockResponse();

    await service.resetPassword('token', 'new-password', mockRequest(), res);

    expect(tx.user.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { passwordHash: 'hashed' },
    });
    expect(tx.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revoked: false },
      data: { revoked: true },
    });
    expect(res.clearCookie).toHaveBeenCalled();
  });
});
