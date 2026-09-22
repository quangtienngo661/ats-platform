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
    const client = (user: Record<string, unknown>) =>
      ({ id: 'socket-1', data: { user }, join: jest.fn() }) as any;
    const job = (organizationId: string) => ({
      departmentId: 'dep-1',
      organizationId,
    });

    it('refuses an org_admin the room of another organization\'s job', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(job('org-2'));
      const socket = client({ userId: 'u1', role: 'org_admin', organizationId: 'org-1' });

      await service.handleJoinJobRoom(socket, { jobId: 'job-2' });

      expect(socket.join).not.toHaveBeenCalled();
    });

    it('lets an org_admin into any job room of its organization', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(job('org-1'));
      const socket = client({ userId: 'u1', role: 'org_admin', organizationId: 'org-1' });

      await service.handleJoinJobRoom(socket, { jobId: 'job-1' });

      expect(socket.join).toHaveBeenCalledWith('job_job-1');
      expect(prisma.recruiter.findUnique).not.toHaveBeenCalled();
    });

    it('refuses a recruiter of another organization before looking at departments', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(job('org-2'));
      const socket = client({ userId: 'u1', role: 'recruiter', organizationId: 'org-1' });

      await service.handleJoinJobRoom(socket, { jobId: 'job-2' });

      expect(socket.join).not.toHaveBeenCalled();
      expect(prisma.recruiter.findUnique).not.toHaveBeenCalled();
    });

    it('still requires a recruiter in the right organization to share the department', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(job('org-1'));
      prisma.recruiter.findUnique.mockResolvedValue({ departmentId: 'dep-other' });
      const socket = client({ userId: 'u1', role: 'recruiter', organizationId: 'org-1' });

      await service.handleJoinJobRoom(socket, { jobId: 'job-1' });

      expect(socket.join).not.toHaveBeenCalled();
    });

    it('lets a platform admin into any job room', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(job('org-2'));
      const socket = client({ userId: 'u1', role: 'admin', organizationId: null });

      await service.handleJoinJobRoom(socket, { jobId: 'job-2' });

      expect(socket.join).toHaveBeenCalledWith('job_job-2');
    });

    it('refuses a candidate', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(job('org-1'));
      const socket = client({ userId: 'u1', role: 'candidate', organizationId: null });

      await service.handleJoinJobRoom(socket, { jobId: 'job-1' });

      expect(socket.join).not.toHaveBeenCalled();
    });
  });

  it('attaches the caller\'s organization at the handshake, from the database', async () => {
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
      in: jest
        .fn()
        .mockReturnValue({
          fetchSockets: jest.fn().mockResolvedValue([{ id: 's1' }]),
        }),
    } as any;

    await expect(service.hasClientsInRoom('interview_x')).resolves.toBe(true);
  });
});
