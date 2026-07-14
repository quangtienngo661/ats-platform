import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus } from '@ats-platform/database';
import { UsersService } from './users.service';
import {
  createPrismaMock,
  createPrismaTransactionMock,
} from '../../test-utils/unit-test-helpers';

jest.mock('bcrypt', () => ({
  hashSync: jest.fn(),
  compareSync: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new UsersService(prisma as any);
    (bcrypt.hashSync as jest.Mock).mockReturnValue('hashed-password');
    (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a user with hashed password inside a transaction', async () => {
    const tx = createPrismaTransactionMock();
    prisma.user.findUnique.mockResolvedValue(null);
    tx.user.create.mockResolvedValue({ userId: 'user-1', email: 'a@test.com' });
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));

    await service.create({
      email: 'a@test.com',
      password: 'secret',
      fullName: 'Alice',
      role: UserRole.admin,
      status: UserStatus.active,
    });

    expect(bcrypt.hashSync).toHaveBeenCalledWith('secret', 10);
    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordHash: 'hashed-password',
          emailVerified: true,
        }),
        omit: { passwordHash: true },
      }),
    );
  });

  it('rejects duplicate user emails', async () => {
    prisma.user.findUnique.mockResolvedValue({ userId: 'existing' });

    await expect(
      service.create({
        email: 'a@test.com',
        password: 'secret',
        fullName: 'Alice',
        role: UserRole.admin,
        status: UserStatus.active,
      }),
    ).rejects.toThrow('Email');
  });

  it('changes password only when the current password matches', async () => {
    prisma.user.findUnique.mockResolvedValue({ passwordHash: 'old-hash' });
    prisma.user.update.mockResolvedValue({ userId: 'user-1' });

    await service.changePassword('user-1', {
      currentPassword: 'old',
      newPassword: 'new',
    });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { passwordHash: 'hashed-password' } }),
    );

    (bcrypt.compareSync as jest.Mock).mockReturnValue(false);
    await expect(
      service.changePassword('user-1', {
        currentPassword: 'wrong',
        newPassword: 'new',
      }),
    ).rejects.toThrow('kh');
  });

  it('rejects empty updates and duplicate update emails', async () => {
    await expect(service.update('user-1', {})).rejects.toThrow('c');

    prisma.user.findUnique
      .mockResolvedValueOnce({ userId: 'user-1', email: 'old@test.com' })
      .mockResolvedValueOnce({ userId: 'other' });

    await expect(
      service.update('user-1', { email: 'new@test.com' }),
    ).rejects.toThrow('Email');
  });

  it('maps a Prisma update not-found error to NotFoundException', async () => {
    prisma.user.findUnique.mockResolvedValue({
      userId: 'user-1',
      email: 'a@test.com',
    });
    prisma.user.update.mockRejectedValue({ code: 'P2025' });

    await expect(
      service.update('user-1', { fullName: 'Alice' }),
    ).rejects.toThrow('Kh');
  });

  describe('remove — restrict-only foreign keys', () => {
    const noChildren = {
      _count: { applicationHistory: 0, scheduledBy: 0, interviewSchedules: 0 },
      candidate: null,
      recruiter: null,
    };

    it('404s when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow('Kh');
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('deletes a user with no dependent rows', async () => {
      prisma.user.findUnique.mockResolvedValue(noChildren);
      prisma.user.delete.mockResolvedValue({ userId: 'user-1' });

      await expect(service.remove('user-1')).resolves.toEqual({
        userId: 'user-1',
      });
    });

    // Each of these relations is Restrict in schema.prisma, so without an explicit
    // check Prisma throws a raw P2003 that only P2025 was ever caught for — a 500.
    it.each([
      [
        'a candidate with applications',
        {
          ...noChildren,
          candidate: { _count: { applications: 1, interviewSessions: 0 } },
        },
        'đơn ứng tuyển',
      ],
      [
        'a candidate with interview sessions',
        {
          ...noChildren,
          candidate: { _count: { applications: 0, interviewSessions: 2 } },
        },
        'phiên phỏng vấn',
      ],
      [
        'a recruiter with job postings',
        { ...noChildren, recruiter: { _count: { jobPostings: 1 } } },
        'tin tuyển dụng',
      ],
      [
        'a user who changed an application status',
        {
          ...noChildren,
          _count: {
            applicationHistory: 3,
            scheduledBy: 0,
            interviewSchedules: 0,
          },
        },
        'thay đổi trạng thái',
      ],
      [
        'a user attached to an interview schedule',
        {
          ...noChildren,
          _count: {
            applicationHistory: 0,
            scheduledBy: 0,
            interviewSchedules: 1,
          },
        },
        'lịch phỏng vấn',
      ],
    ])('refuses to delete %s', async (_label, user, message) => {
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(service.remove('user-1')).rejects.toThrow(message as string);
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });
  });
});
