import { Logger } from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InterviewSessionService } from './interview-session.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

@WebSocketGateway({
    cors: { origin: '*' },
})
export class InterviewGateway {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(InterviewGateway.name);

    constructor(
        private readonly interviewSessionService: InterviewSessionService,
        private readonly prisma: PrismaService,
    ) { }

    // ═══════════════════════════════════════════════════════════════
    // interview:join_session — Ứng viên tham gia phiên phỏng vấn
    // ═══════════════════════════════════════════════════════════════
    @SubscribeMessage('interview:join_session')
    async handleJoinSession(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionId: string },
    ) {
        try {
            const { sessionId } = data;
            if (!(await this.verifySessionOwnership(client, sessionId))) return;

            const room = `interview_${sessionId}`;

            // Thêm client vào room của session
            client.join(room);
            this.logger.log(`Client ${client.id} joined interview room: ${room}`);

            // Lấy câu hỏi hiện tại (hỗ trợ cả reconnect)
            const currentQuestion = await this.interviewSessionService.getCurrentQuestion(sessionId);

            if (currentQuestion) {
                // Gửi câu hỏi về cho ứng viên
                client.emit('interview:question', currentQuestion);
            } else {
                // Tất cả câu hỏi đã được trả lời → Kết thúc session
                client.emit('interview:session_ended', {
                    message: 'Tất cả câu hỏi đã được trả lời. Đang tạo kết quả...',
                });
            }
        } catch (error) {
            this.logger.error(`Error joining session: ${error.message}`);
            client.emit('interview:error', {
                message: this.toClientMessage(error, 'Không thể tham gia phiên phỏng vấn. Vui lòng thử lại.'),
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // interview:submit_answer — Ứng viên gửi câu trả lời chính
    // ═══════════════════════════════════════════════════════════════
    @SubscribeMessage('interview:submit_answer')
    async handleSubmitAnswer(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionId: string; qnaId: string; answerText: string },
    ) {
        try {
            const { sessionId, qnaId, answerText } = data;
            if (!(await this.verifySessionOwnership(client, sessionId))) return;

            // Gọi service xử lý (bao gồm gọi AI check follow-up, ~10-15s)
            const result = await this.interviewSessionService.submitAnswer(
                sessionId,
                qnaId,
                answerText,
            );

            switch (result.type) {
                case 'followup': {
                    client.emit('interview:followup_question', {
                        qnaId: result.qnaId,
                        followupQuestion: result.followupQuestion,
                    });
                    break;
                }

                case 'next_question': {
                    client.emit('interview:question', result.question);
                    break;
                }

                case 'end': {
                    client.emit('interview:generating_result', {
                        message: 'Đang tổng hợp kết quả phỏng vấn...',
                    });
                    const finalResult = await this.interviewSessionService.endSession(sessionId);
                    this.emitSessionEndResult(client, finalResult);
                    break;
                }
            }
        } catch (error) {
            this.logger.error(`Error submitting answer: ${error.message}`);
            client.emit('interview:error', {
                message: this.toClientMessage(error, 'Không thể gửi câu trả lời. Vui lòng thử lại.'),
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // interview:submit_followup — Ứng viên gửi câu trả lời phụ
    // ═══════════════════════════════════════════════════════════════
    @SubscribeMessage('interview:submit_followup')
    async handleSubmitFollowup(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionId: string; qnaId: string; followupAnswer: string },
    ) {
        try {
            const { sessionId, qnaId, followupAnswer } = data;
            if (!(await this.verifySessionOwnership(client, sessionId))) return;

            // Gọi service (KHÔNG gọi AI → response gần như tức thì)
            const result = await this.interviewSessionService.submitFollowupAnswer(
                sessionId,
                qnaId,
                followupAnswer,
            );

            switch (result.type) {
                case 'next_question': {
                    client.emit('interview:question', result.question);
                    break;
                }

                case 'end': {
                    client.emit('interview:generating_result', {
                        message: 'Đang tổng hợp kết quả phỏng vấn...',
                    });
                    const finalResult = await this.interviewSessionService.endSession(sessionId);
                    this.emitSessionEndResult(client, finalResult);
                    break;
                }
            }
        } catch (error) {
            this.logger.error(`Error submitting followup: ${error.message}`);
            client.emit('interview:error', {
                message: this.toClientMessage(error, 'Không thể gửi câu trả lời phụ. Vui lòng thử lại.'),
            });
        }
    }

    private toClientMessage(error: any, fallback: string) {
        const message = error?.message;
        if (typeof message !== 'string' || !message.trim()) return fallback;
        return /[À-ỹ]/.test(message) ? message : fallback;
    }

    private async verifySessionOwnership(client: Socket, sessionId: string): Promise<boolean> {
        const userId = client.data.user?.userId;
        if (!userId) {
            client.emit('interview:error', { message: 'Bạn cần đăng nhập để thực hiện thao tác này' });
            return false;
        }

        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
            select: { candidateId: true },
        });

        const session = await this.prisma.interviewSession.findUnique({
            where: { sessionId },
            select: { candidateId: true },
        });

        if (!candidate || !session || session.candidateId !== candidate.candidateId) {
            client.emit('interview:error', { message: 'Bạn không có quyền truy cập phiên phỏng vấn này' });
            return false;
        }

        return true;
    }

    private emitSessionEndResult(client: Socket, result: any) {
        if (result?.status === 'pending_result') {
            client.emit('interview:pending_result', result);
            return;
        }

        client.emit('interview:session_completed', result);
    }
}
