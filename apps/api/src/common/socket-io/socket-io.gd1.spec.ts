import { UserRole, UserStatus } from '@ats-platform/database';
import { SocketIoService } from './socket-io.service';
import { createJwtMock, createPrismaMock } from '../../test-utils/unit-test-helpers';

describe('GĐ1 A8 — stale socket authority', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: SocketIoService;
  const socket = () => ({
    id: 'stale-socket',
    data: { user: { userId: 'u1', role: UserRole.org_admin, organizationId: 'org-1' } },
    join: jest.fn(),
    disconnect: jest.fn(),
  });

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new SocketIoService(createJwtMock() as any, prisma as any);
    prisma.jobPosting.findUnique.mockResolvedValue({ departmentId: 'dep-1', organizationId: 'org-1' });
  });

  it.each([
    ['moved to another organization', {
      userId: 'u1', role: UserRole.org_admin, status: UserStatus.active,
      organizationId: 'org-2', recruiter: null,
    }],
    ['demoted to candidate', {
      userId: 'u1', role: UserRole.candidate, status: UserStatus.active,
      organizationId: null, recruiter: null,
    }],
    ['deactivated', {
      userId: 'u1', role: UserRole.org_admin, status: UserStatus.inactive,
      organizationId: 'org-1', recruiter: null,
    }],
    ['deleted', null],
  ])('rejects a previously authorized socket after its User is %s', async (_label, current) => {
    prisma.user.findUnique.mockResolvedValue(current);
    const client = socket();

    await service.handleJoinJobRoom(client as any, { jobId: 'job-1' });

    expect(client.join).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'u1' },
    }));
  });

  it('uses a new database organization for the next join', async () => {
    prisma.user.findUnique.mockResolvedValue({
      userId: 'u1', role: UserRole.org_admin, status: UserStatus.active,
      organizationId: 'org-2', recruiter: null,
    });
    prisma.jobPosting.findUnique.mockResolvedValue({ departmentId: 'dep-2', organizationId: 'org-2' });
    const client = socket();

    await service.handleJoinJobRoom(client as any, { jobId: 'job-2' });

    expect(client.join).toHaveBeenCalledWith('job_job-2');
  });

  it('disconnects every matching socket even after it left its user room', () => {
    const matching = socket();
    const secondMatching = { ...socket(), id: 'second-tab' };
    const unrelated = {
      ...socket(), id: 'unrelated',
      data: { user: { userId: 'u2', role: UserRole.org_admin, organizationId: 'org-1' } },
    };
    const unauthenticated = {
      id: 'pending', data: {}, disconnect: jest.fn(),
    };
    // No user room exists in this mock. Disconnecting only server.in(user_u1)
    // would leave both matching clients alive and keep their job-room access.
    service.server = {
      sockets: { sockets: new Map([
        ['first', matching], ['second', secondMatching],
        ['other', unrelated], ['pending', unauthenticated],
      ]) },
    } as any;

    service.disconnectUser('u1');

    expect(matching.disconnect).toHaveBeenCalledWith(true);
    expect(secondMatching.disconnect).toHaveBeenCalledWith(true);
    expect(unrelated.disconnect).not.toHaveBeenCalled();
    expect(unauthenticated.disconnect).not.toHaveBeenCalled();
  });

  it('is safe to invalidate sessions before the socket server initializes', () => {
    expect(() => service.disconnectUser('u1')).not.toThrow();
  });

  it('does not authenticate a pending stale DB snapshot after invalidation', async () => {
    const jwt = createJwtMock();
    jwt.verifyAsync.mockResolvedValue({ userId: 'u1' });
    service = new SocketIoService(jwt as any, prisma as any);
    let finishDatabaseRead!: (value: unknown) => void;
    prisma.user.findUnique.mockReturnValue(new Promise((resolve) => {
      finishDatabaseRead = resolve;
    }));
    const client = {
      id: 'pending-auth',
      handshake: { auth: { token: 't' }, headers: {} },
      data: {}, join: jest.fn(), disconnect: jest.fn(),
    };
    service.server = { sockets: { sockets: new Map([['pending', client]]) } } as any;

    const authentication = service.handleConnection(client as any);
    // Let JWT verification finish; the tenant resolver now holds a stale read.
    await Promise.resolve();
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    service.disconnectUser('u1');
    finishDatabaseRead({
      userId: 'u1', role: UserRole.org_admin, status: UserStatus.active,
      organizationId: 'org-1', recruiter: null,
    });
    await authentication;

    expect(client.join).not.toHaveBeenCalled();
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('does not join a job from a DB snapshot invalidated while lookup was pending', async () => {
    prisma.user.findUnique.mockResolvedValue({
      userId: 'u1', role: UserRole.org_admin, status: UserStatus.active,
      organizationId: 'org-1', recruiter: null,
    });
    let finishJobRead!: (value: unknown) => void;
    prisma.jobPosting.findUnique.mockReturnValue(new Promise((resolve) => {
      finishJobRead = resolve;
    }));
    const client = socket();
    service.server = { sockets: { sockets: new Map([['stale', client]]) } } as any;

    const joining = service.handleJoinJobRoom(client as any, { jobId: 'job-1' });
    // Existing async boundary plus the tenant resolver: wait until the guarded
    // job read is in flight, without using a timer or a listening service.
    for (let index = 0; index < 12 && prisma.jobPosting.findUnique.mock.calls.length === 0; index += 1) {
      await Promise.resolve();
    }
    expect(prisma.jobPosting.findUnique).toHaveBeenCalledTimes(1);
    service.disconnectUser('u1');
    finishJobRead({ departmentId: 'dep-1', organizationId: 'org-1' });
    await joining;

    expect(client.join).not.toHaveBeenCalled();
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });
});
