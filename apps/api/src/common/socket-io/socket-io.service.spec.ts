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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocketIoService,
        { provide: JwtService, useValue: createJwtMock() },
        { provide: PrismaService, useValue: createPrismaMock() },
      ],
    }).compile();

    service = module.get<SocketIoService>(SocketIoService);
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
