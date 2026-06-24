import { Processor, WorkerHost } from "@nestjs/bullmq";
import { GeminiService } from "../../../common/external-apis/gemini/gemini.service";
import { Job } from "bullmq";
import { CvParsedDataService } from "../cv-parsed-data/cv-parsed-data.service";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { NotificationType, ParsingStatus } from "@ats-platform/database";
import { Logger } from "@nestjs/common";
import { SocketIoService } from "../../../common/socket-io/socket-io.service";
import { NotificationsService } from "../../notifications/notifications.service";

@Processor('cv-processing', { concurrency: 5 })
export class CvParsingProcessor extends WorkerHost {
    constructor(
        private readonly cvParsedDataService: CvParsedDataService,
        private readonly geminiService: GeminiService,
        private readonly prisma: PrismaService,
        private readonly socketService: SocketIoService,
        private readonly notificationsService: NotificationsService,
    ) {
        super();
    }
    async process(job: Job): Promise<any> {
        if (job.name === 'parse-cv') {
            const { cvId } = job.data;

            await this.prisma.cV.update({
                where: { cvId },
                data: { parsingStatus: ParsingStatus.processing },
            });

            try {
                const cv = await this.prisma.cV.findUnique({
                    where: { cvId },
                    select: {
                        rawText: true,
                        fileName: true,
                        candidate: { select: { userId: true } },
                    },
                });

                if (!cv?.rawText) {
                    throw new Error(`Không tìm thấy nội dung văn bản của CV ID: ${cvId}`);
                }

                // 3. Gọi Gemini parse
                const parsedData = await this.geminiService.parseCV(
                    cvId,
                    cv.rawText,
                );

                // 4. Lưu DB trong transaction
                const result = await this.prisma.$transaction(async (tx) => {
                    await this.cvParsedDataService.create(cvId, parsedData, tx);
                    return tx.cV.update({
                        where: { cvId },
                        data: { parsingStatus: ParsingStatus.completed },
                        include: { parsedData: true }
                    });
                });

                const userId = cv.candidate.userId;
                this.socketService.handleEmit("cvs:parsed_successfully", { cvId, updatedCv: result }, `user_${userId}`);
                await this.createNotificationSafe(
                    userId,
                    'Phân tích CV hoàn tất',
                    `CV "${cv.fileName}" của bạn đã được phân tích thành công.`,
                );

                Logger.log(
                    `CV parsing completed for CV ID: ${cvId}`,
                    'CvParsingProcessor',
                );



            } catch (error) {
                // 6. Update failed + ghi error log
                const errorCv = await this.prisma.cV.update({
                    where: { cvId },
                    data: {
                        parsingStatus: ParsingStatus.failed,
                        errorLog: error.message,
                    },
                    include: {
                        candidate: { select: { userId: true } },
                    },
                });

                const userId = errorCv.candidate.userId;
                this.socketService.handleEmit("cvs:parsed_successfully", { cvId, updatedCv: errorCv }, `user_${userId}`);
                await this.createNotificationSafe(
                    userId,
                    'Phân tích CV thất bại',
                    `Không thể phân tích CV "${errorCv.fileName}" của bạn. Vui lòng thử lại.`,
                );

                Logger.error(
                    `CV parsing failed for CV ID: ${cvId}`,
                    error.stack,
                    'CvParsingProcessor',
                );

                throw error; // BullMQ retry
            }
        }
    }

    private async createNotificationSafe(userId: string, title: string, message: string) {
        try {
            await this.notificationsService.create({
                userId,
                type: NotificationType.system,
                title,
                message,
            });
        } catch (error) {
            Logger.warn(
                `Failed to create CV parsing notification for user ${userId}: ${error.message}`,
                'CvParsingProcessor',
            );
        }
    }
}
