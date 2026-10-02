import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { SocketIoService } from './socket-io.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  createJwtMock,
  createPrismaMock,
} from '../../test-utils/unit-test-helpers';

describe('SocketIoService', () => {
  let service: SocketIoService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let jwt: ReturnType<typeof createJwtMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    jwt = createJwtMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocketIoService,
        { provide: JwtService, useValue: jwt },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SocketIoService>(SocketIoService);
  });

  // The socket half of criterion 2. canJoinJobRoom is not a Prisma query, so no
  // query-level filter would ever have covered it.
  describe('join_job_room — organization boundary', () => {
    const client = (user: Record<string, unknown>) => {
      // Every join now resolves current authority. The DB record explicitly
      // matches the cached identity; stale-cache cases live in socket-io.gd1.
      prisma.user.findUnique.mockResolvedValue({
        ...user,
        status: 'active',
        recruiter: user.role === 'recruiter'
          ? { organizationId: user.organizationId } : null,
      });
      return ({ id: 'socket-1', data: { user }, join: jest.fn(), disconnect: jest.fn() }) as any;
    };
    const job = (organizationId: string) => ({
      departmentId: 'dep-1',
      organizationId,
    });

    it("refuses an org_admin the room of another organization's job", async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(job('org-2'));
      const socket = client({
        userId: 'u1',
        role: 'org_admin',
        organizationId: 'org-1',
      });

      await service.handleJoinJobRoom(socket, { jobId: 'job-2' });

      expect(socket.join).not.toHaveBeenCalled();
    });

    it('lets an org_admin into any job room of its organization', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(job('org-1'));
      const socket = client({
        userId: 'u1',
        role: 'org_admin',
        organizationId: 'org-1',
      });

      await service.handleJoinJobRoom(socket, { jobId: 'job-1' });

      expect(socket.join).toHaveBeenCalledWith('job_job-1');
      expect(prisma.recruiter.findUnique).not.toHaveBeenCalled();
    });

    it('refuses a recruiter of another organization before looking at departments', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(job('org-2'));
      const socket = client({
        userId: 'u1',
        role: 'recruiter',
        organizationId: 'org-1',
      });

      await service.handleJoinJobRoom(socket, { jobId: 'job-2' });

      expect(socket.join).not.toHaveBeenCalled();
      expect(prisma.recruiter.findUnique).not.toHaveBeenCalled();
    });

    it('still requires a recruiter in the right organization to share the department', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(job('org-1'));
      prisma.recruiter.findUnique.mockResolvedValue({
        departmentId: 'dep-other',
      });
      const socket = client({
        userId: 'u1',
        role: 'recruiter',
        organizationId: 'org-1',
      });

      await service.handleJoinJobRoom(socket, { jobId: 'job-1' });

      expect(socket.join).not.toHaveBeenCalled();
    });

    it('lets a platform admin into any job room', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(job('org-2'));
      const socket = client({
        userId: 'u1',
        role: 'admin',
        organizationId: null,
      });

      await service.handleJoinJobRoom(socket, { jobId: 'job-2' });

      expect(socket.join).toHaveBeenCalledWith('job_job-2');
    });

    it('refuses a candidate', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(job('org-1'));
      const socket = client({
        userId: 'u1',
        role: 'candidate',
        organizationId: null,
      });

      await service.handleJoinJobRoom(socket, { jobId: 'job-1' });

      expect(socket.join).not.toHaveBeenCalled();
    });
  });

  it("attaches the caller's organization at the handshake, from the database", async () => {
    jwt.verifyAsync.mockResolvedValue({ userId: 'u1' });
    prisma.user.findUnique.mockResolvedValue({
      userId: 'u1',
      role: 'recruiter',
      fullName: 'Rec',
      status: 'active',
      organizationId: null,
      recruiter: { organizationId: 'org-1' },
    });
    const socket = {
      id: 'socket-1',
      handshake: { auth: { token: 'Bearer t' }, headers: {} },
      data: {} as Record<string, any>,
      join: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    await service.handleConnection(socket);

    expect(socket.data.user).toEqual({
      userId: 'u1',
      role: 'recruiter',
      fullName: 'Rec',
      organizationId: 'org-1',
    });
    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('does not lose an authorized job-room join arriving during authentication', async () => {
    let verify!: (value: { userId: string }) => void;
    jwt.verifyAsync.mockReturnValue(
      new Promise((resolve) => {
        verify = resolve;
      }),
    );
    prisma.user.findUnique.mockResolvedValue({
      userId: 'u1',
      role: 'org_admin',
      fullName: 'Admin',
      status: 'active',
      organizationId: 'org-1',
      recruiter: null,
    });
    prisma.jobPosting.findUnique.mockResolvedValue({
      departmentId: 'dep-1',
      organizationId: 'org-1',
    });
    const socket = {
      id: 'socket-race',
      handshake: { auth: { token: 't' }, headers: {} },
      data: {},
      join: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    const authentication = service.handleConnection(socket);
    const joining = service.handleJoinJobRoom(socket, { jobId: 'job-1' });
    verify({ userId: 'u1' });
    await Promise.all([authentication, joining]);

    expect(socket.data.user.organizationId).toBe('org-1');
    expect(socket.join).toHaveBeenCalledWith('job_job-1');
  });

  it.each(['missing', 'inactive', 'invalid'] as const)(
    'disconnects a %s caller before it can join a room',
    async (scenario) => {
      jwt.verifyAsync.mockResolvedValue({ userId: 'u1' });
      if (scenario === 'invalid')
        jwt.verifyAsync.mockRejectedValue(new Error('bad JWT'));
      prisma.user.findUnique.mockResolvedValue(
        scenario === 'missing'
          ? null
          : {
              userId: 'u1',
              role: 'candidate',
              status: 'inactive',
              organizationId: null,
              recruiter: null,
            },
      );
      const socket = {
        id: 'socket-denied',
        handshake: { auth: { token: 't' }, headers: {} },
        data: {},
        join: jest.fn(),
        disconnect: jest.fn(),
      } as any;

      await service.handleConnection(socket);

      expect(socket.disconnect).toHaveBeenCalledWith(true);
      expect(socket.join).not.toHaveBeenCalled();
    },
  );

  it.each(['invalid-token', 'other-organization'])(
    'denies a pending room join after authentication resolves to %s',
    async (scenario) => {
      let finish!: (value: { userId: string }) => void;
      let fail!: (error: Error) => void;
      jwt.verifyAsync.mockReturnValue(new Promise((resolve, reject) => {
        finish = resolve;
        fail = reject;
      }));
      prisma.user.findUnique.mockResolvedValue({
        userId: 'u1', role: 'org_admin', status: 'active',
        organizationId: 'org-1', recruiter: null,
      });
      prisma.jobPosting.findUnique.mockResolvedValue({ departmentId: 'dep-1', organizationId: 'org-2' });
      const socket = {
        id: 'pending-denied', handshake: { auth: { token: 't' }, headers: {} },
        data: {}, join: jest.fn(), disconnect: jest.fn(),
      } as any;

      const authentication = service.handleConnection(socket);
      const joining = service.handleJoinJobRoom(socket, { jobId: 'job-2' });
      if (scenario === 'invalid-token') fail(new Error('bad JWT'));
      else finish({ userId: 'u1' });
      await Promise.all([authentication, joining]);

      expect(socket.join).not.toHaveBeenCalledWith('job_job-2');
      if (scenario === 'invalid-token') {
        expect(socket.disconnect).toHaveBeenCalledWith(true);
        expect(prisma.jobPosting.findUnique).not.toHaveBeenCalled();
      }
    },
  );

  it('reports an empty room as having no clients', async () => {
    service.server = {
      in: jest
        .fn()
        .mockReturnValue({ fetchSockets: jest.fn().mockResolvedValue([]) }),
    } as any;

    await expect(service.hasClientsInRoom('interview_x')).resolves.toBe(false);
  });

  it('reports a room with a socket as live', async () => {
    service.server = {
      in: jest.fn().mockReturnValue({
        fetchSockets: jest.fn().mockResolvedValue([{ id: 's1' }]),
      }),
    } as any;

    await expect(service.hasClientsInRoom('interview_x')).resolves.toBe(true);
  });
});
