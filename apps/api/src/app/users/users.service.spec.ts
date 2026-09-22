import * as bcrypt from 'bcrypt';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { UserRole, UserStatus } from '@ats-platform/database';
import { UsersService } from './users.service';
import { UpdateMeDto } from './dtos/user.dto';
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

  // PATCH /users/me is reachable by ANY authenticated account, candidates included.
  // Its body type used to be the admin's UpdateUserDto, and updateMe forwarded it to
  // the admin update path verbatim — so a candidate could send {"role":"admin"} and
  // promote itself to platform administrator.
  it('never lets a user change its own role or status through updateMe', async () => {
    prisma.user.findUnique.mockResolvedValue({
      userId: 'user-1',
      email: 'mallory@test.com',
    });
    prisma.user.update.mockResolvedValue({ userId: 'user-1' });

    await service.updateMe('user-1', {
      fullName: 'Mallory',
      role: UserRole.admin,
      status: UserStatus.inactive,
    } as any);

    const { data } = prisma.user.update.mock.calls[0][0];
    expect(data.fullName).toBe('Mallory');
    expect(data.role).toBeUndefined();
    expect(data.status).toBeUndefined();
  });

  describe('PATCH /users/me body (UpdateMeDto)', () => {
    // Same options main.ts installs globally.
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    const asBody = { type: 'body' as const, metatype: UpdateMeDto };

    it('accepts the profile fields', async () => {
      await expect(
        pipe.transform(
          { fullName: 'Mallory', phoneNumber: '+84901234567' },
          asBody,
        ),
      ).resolves.toMatchObject({ fullName: 'Mallory' });
    });

    it.each([
      ['role', { fullName: 'Mallory', role: UserRole.admin }],
      ['status', { fullName: 'Mallory', status: UserStatus.inactive }],
      ['email', { email: 'someone-else@test.com' }],
      // A self-service organization binding would let anyone make itself an
      // administrator of any organization.
      [
        'organizationId',
        {
          fullName: 'Mallory',
          organizationId: '00000000-0000-4000-8000-000000000001',
        },
      ],
    ])('rejects a body that carries %s', async (_field, body) => {
      await expect(pipe.transform(body, asBody)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  // An org_admin is bound to exactly one organization and nobody else carries one
  // (a DB CHECK constraint says the same; this is the readable version).
  describe('org_admin binding', () => {
    const base = {
      email: 'oa@test.com',
      password: 'secret',
      fullName: 'Org Admin',
      status: UserStatus.active,
    };
    let tx: ReturnType<typeof createPrismaTransactionMock>;

    beforeEach(() => {
      tx = createPrismaTransactionMock();
      tx.user.create.mockResolvedValue({ userId: 'user-9' });
      prisma.$transaction.mockImplementation((callback: any) => callback(tx));
      prisma.user.findUnique.mockResolvedValue(null);
    });

    it('creates an org_admin bound to the organization it names', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        organizationId: 'org-1',
      });

      await service.create({
        ...base,
        role: UserRole.org_admin,
        organizationId: 'org-1',
      });

      expect(tx.user.create.mock.calls[0][0].data).toMatchObject({
        role: UserRole.org_admin,
        organizationId: 'org-1',
      });
    });

    it('refuses an org_admin with no organization', async () => {
      await expect(
        service.create({ ...base, role: UserRole.org_admin }),
      ).rejects.toThrow('phải được gắn với một tổ chức');
      expect(tx.user.create).not.toHaveBeenCalled();
    });

    it('404s an org_admin bound to an organization that does not exist', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          ...base,
          role: UserRole.org_admin,
          organizationId: 'org-ghost',
        }),
      ).rejects.toThrow('Không tìm thấy tổ chức');
      expect(tx.user.create).not.toHaveBeenCalled();
    });

    it.each([UserRole.recruiter, UserRole.candidate, UserRole.admin])(
      'refuses an organization on a %s',
      async (role) => {
        await expect(
          service.create({ ...base, role, organizationId: 'org-1' }),
        ).rejects.toThrow('Chỉ tài khoản quản trị tổ chức');
        expect(tx.user.create).not.toHaveBeenCalled();
      },
    );

    it('stores no organization for any other role', async () => {
      await service.create({ ...base, role: UserRole.recruiter });

      expect(tx.user.create.mock.calls[0][0].data.organizationId).toBeNull();
    });

    it('drops the binding when an org_admin becomes a recruiter', async () => {
      prisma.user.findUnique.mockResolvedValue({
        userId: 'user-9',
        email: 'oa@test.com',
        role: UserRole.org_admin,
        organizationId: 'org-1',
      });
      prisma.user.update.mockResolvedValue({ userId: 'user-9' });

      await service.update('user-9', { role: UserRole.recruiter });

      expect(prisma.user.update.mock.calls[0][0].data).toMatchObject({
        role: UserRole.recruiter,
        organizationId: null,
      });
    });

    it('refuses to make a user an org_admin without an organization', async () => {
      prisma.user.findUnique.mockResolvedValue({
        userId: 'user-9',
        email: 'r@test.com',
        role: UserRole.recruiter,
        organizationId: null,
      });

      await expect(
        service.update('user-9', { role: UserRole.org_admin }),
      ).rejects.toThrow('phải được gắn với một tổ chức');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('leaves the binding alone when the update touches neither role nor organization', async () => {
      prisma.user.findUnique.mockResolvedValue({
        userId: 'user-9',
        email: 'oa@test.com',
        role: UserRole.org_admin,
        organizationId: 'org-1',
      });
      prisma.user.update.mockResolvedValue({ userId: 'user-9' });

      await service.update('user-9', { fullName: 'Renamed' });

      expect(
        prisma.user.update.mock.calls[0][0].data.organizationId,
      ).toBeUndefined();
      expect(prisma.organization.findUnique).not.toHaveBeenCalled();
    });
  });

  it('rejects an updateMe with nothing to change', async () => {
    await expect(service.updateMe('user-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
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
