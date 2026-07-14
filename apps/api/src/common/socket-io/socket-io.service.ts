import { UserStatus } from '@ats-platform/types';
import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
  },
  allowRequest: (req, callback) => {
    const origin = req.headers.origin;
    const allowedOrigins = [process.env.CLIENT_URL];
    const isAllowed = allowedOrigins.includes(origin);
    callback(null, isAllowed);
  },
})
export class SocketIoService
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  logger: Logger = new Logger(SocketIoService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket server initialized');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    try {
      let token =
        client.handshake.auth?.token || client.handshake.headers?.authorization;
      if (token && token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      }

      if (!token) {
        this.logger.warn(
          `Client disconnected: No token provided - ${client.id}`,
        );
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);

      // A valid signature isn't enough: the account may have been deactivated
      // after this token was issued. HTTP re-checks this in JwtStrategy; the
      // socket handshake must do the same or deactivation wouldn't apply here.
      const user = payload?.userId
        ? await this.prisma.user.findUnique({
            where: { userId: payload.userId },
            select: { userId: true, role: true, fullName: true, status: true },
          })
        : null;

      if (!user || user.status !== UserStatus.active) {
        this.logger.warn(
          `Client disconnected: inactive or unknown user - ${client.id}`,
        );
        client.disconnect(true);
        return;
      }

      client.data.user = {
        userId: user.userId,
        role: user.role,
        fullName: user.fullName,
      };

      const room = `user_${user.userId}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined room: ${room}`);

      this.logger.log(
        `Client connected: ${client.id} (User ID: ${user.userId})`,
      );
    } catch (error) {
      this.logger.warn(`Client disconnected: Invalid token - ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;

    if (user) {
      this.logger.log(
        `Client disconnected: ${client.id} (User ID: ${user.userId})`,
      );
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  private async canJoinJobRoom(client: Socket, jobId: string) {
    const user = client.data.user;
    if (!user?.userId) return false;

    const job = await this.prisma.jobPosting.findUnique({
      where: { jobId },
      select: { departmentId: true },
    });

    if (!job) return false;
    if (user.role === 'admin') return true;
    if (user.role !== 'recruiter') return false;

    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId: user.userId },
      select: { departmentId: true },
    });

    return recruiter?.departmentId === job.departmentId;
  }

  handleEmit<T>(eventName: string, data: T, room?: string) {
    if (room) {
      this.server.to(room).emit(eventName, data);
    } else {
      this.logger.log(`Emitting event ${eventName} to all clients`);
      this.server.emit(eventName, data);
    }
  }

  /**
   * Whether anyone is currently connected to `room`. Used to tell a genuinely
   * abandoned interview apart from a candidate who dropped and reconnected.
   */
  async hasClientsInRoom(room: string): Promise<boolean> {
    const sockets = await this.server.in(room).fetchSockets();
    return sockets.length > 0;
  }

  @SubscribeMessage('join_user_room')
  handleJoinUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    if (data?.userId && client.data.user?.userId === data.userId) {
      const room = `user_${data.userId}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined room: ${room}`);
    } else {
      this.logger.warn(
        `Client ${client.id} attempted to join another user's room`,
      );
    }
  }

  @SubscribeMessage('leave_user_room')
  handleLeaveUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    if (data?.userId && client.data.user?.userId === data.userId) {
      const room = `user_${data.userId}`;
      client.leave(room);
      this.logger.log(`Client ${client.id} left room: ${room}`);
    }
  }

  @SubscribeMessage('join_job_room')
  async handleJoinJobRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { jobId: string },
  ) {
    if (!data?.jobId) return;

    const canJoin = await this.canJoinJobRoom(client, data.jobId);
    if (!canJoin) {
      this.logger.warn(
        `Client ${client.id} attempted to join unauthorized job room: job_${data.jobId}`,
      );
      return;
    }

    const room = `job_${data.jobId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
  }

  @SubscribeMessage('leave_job_room')
  handleLeaveJobRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { jobId: string },
  ) {
    if (data?.jobId) {
      const room = `job_${data.jobId}`;
      client.leave(room);
      this.logger.log(`Client ${client.id} left room: ${room}`);
    }
  }
}
