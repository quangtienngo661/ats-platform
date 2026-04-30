import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AiActionType, AiLogStatus } from '@ats-platform/database';

@Injectable()
export class AiUsageLogsService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    async create({
        refId,
        actionType,
        model,
        promptTokenCount,
        candidatesTokenCount,
        duration,
        status,
    }: {
        refId: string;
        actionType: AiActionType;
        model: string;
        promptTokenCount: number;
        candidatesTokenCount: number;
        duration: number;
        status: AiLogStatus;
    }) {
        try {
            return await this.prisma.aiUsageLog.create({
                data: {
                    referenceId: refId,
                    actionType,
                    modelName: model,
                    promptTokens: promptTokenCount,
                    completionTokens: candidatesTokenCount,
                    durationMs: duration,
                    status,
                },
            });
        } catch (error) {
            // Không throw — log failure không được làm crash main flow
            Logger.error(
                `Failed to save AI usage log: ${error.message}`,
                error.stack,
                'AiUsageLogsService',
            );
        }
    }

    async getLogsById(referenceId: string) {
        const logs = await this.prisma.aiUsageLog.findMany({
            where: { referenceId },
            orderBy: { createdAt: 'desc' },
        });

        if (!logs.length) {
            throw new NotFoundException(`No AI usage logs found for reference ID: ${referenceId}`);
        }

        return logs;
    }

    async getAllLogs(
        filters?: {
            actionType?: AiActionType;
            status?: AiLogStatus;
        },
        page?: number,
    ) {
        const limit = 10; // hard-coded limit value
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            await this.prisma.aiUsageLog.findMany({
                where: {
                    ...(filters?.actionType && { actionType: filters.actionType }),
                    ...(filters?.status && { status: filters.status }),
                },
                skip: skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            await this.prisma.aiUsageLog.count(),
        ]);
        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        }
    }
}
