import { Injectable, Logger } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
// @Injectable()
@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class SocketIoService implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    logger: Logger = new Logger(SocketIoService.name);

    constructor(private readonly jwtService: JwtService) { }

    afterInit(server: Server) {
        this.logger.log('WebSocket server initialized');
    }

    async handleConnection(client: Socket, ...args: any[]) {
        try {
            let token = client.handshake.auth?.token || client.handshake.headers?.authorization;
            if (token && token.startsWith('Bearer ')) {
                token = token.split(' ')[1];
            }

            if (!token) {
                this.logger.warn(`Client disconnected: No token provided - ${client.id}`);
                client.disconnect(true);
                return;
            }

            const payload = await this.jwtService.verifyAsync(token);
            client.data.user = payload;

            if (payload) {
                const room = `user_${payload.userId}`;
                client.join(room);
                this.logger.log(`Client ${client.id} joined room: ${room}`);
            }

            this.logger.log(`Client connected: ${client.id} (User ID: ${payload.userId})`);
        } catch (error) {
            this.logger.warn(`Client disconnected: Invalid token - ${client.id}`);
            client.disconnect(true);
        }
    }

    handleDisconnect(client: Socket) {
        const user = client.data.user;

        if (user) {
            this.logger.log(`Client disconnected: ${client.id} (User ID: ${user.userId})`);
        } else {
            this.logger.log(`Client disconnected: ${client.id}`);
        }
    }


    handleEmit<T>(eventName: string, data: T) {
        this.server.emit(eventName, data);
    }

    @SubscribeMessage('join_user_room')
    handleJoinUserRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
        if (data?.userId) {
            const room = `user_${data.userId}`;
            client.join(room);
            this.logger.log(`Client ${client.id} joined room: ${room}`);
        }
    }

    @SubscribeMessage('join_job_room')
    handleJoinJobRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { jobId: string }) {
        if (data?.jobId) {
            const room = `job_${data.jobId}`;
            client.join(room);
            this.logger.log(`Client ${client.id} joined room: ${room}`);
        }
    }

    @SubscribeMessage('leave_job_room')
    handleLeaveJobRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { jobId: string }) {
        if (data?.jobId) {
            const room = `job_${data.jobId}`;
            client.leave(room);
            this.logger.log(`Client ${client.id} left room: ${room}`);
        }
    }

}
