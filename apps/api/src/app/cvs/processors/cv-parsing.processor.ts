import { Processor, WorkerHost } from "@nestjs/bullmq";
import { GeminiService } from "../../../common/external-apis/gemini/gemini.service";
import { Job } from "bullmq";
import { CvParsedDataService } from "../cv-parsed-data/cv-parsed-data.service";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { ParsingStatus } from "@ats-platform/database";
import { Logger } from "@nestjs/common";
import { CV_PARSING_PROMPT } from "../../../common/constants/gemini-api";
import { SocketIoService } from "apps/api/src/common/socket-io/socket-io.service";

@Processor('cv-processing', { concurrency: 5 })
export class CvParsingProcessor extends WorkerHost {
    constructor(
        private readonly cvParsedDataService: CvParsedDataService,
        private readonly geminiService: GeminiService,
        private readonly prisma: PrismaService,
        private readonly socketService: SocketIoService,
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
                    select: { rawText: true },
                });

                if (!cv?.rawText) {
                    throw new Error(`Raw text not found for CV ID: ${cvId}`);
                }

                // 3. Gọi Gemini parse
                const parsedData = await this.geminiService.parseCV(
                    cvId,
                    cv.rawText,
                );

                // 4. Lưu DB trong transaction
                await this.prisma.$transaction(async (tx) => {
                    await this.cvParsedDataService.create(cvId, parsedData, tx);
                    const result = await tx.cV.update({
                        where: { cvId },
                        data: { parsingStatus: ParsingStatus.completed },
                        include: { parsedData: true }
                    });

                    this.socketService.handleEmit("cvs:parsed_successfully", { cvId, updatedCv: result });
                });

                // 5. TODO: Socket notification
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
                });

                this.socketService.handleEmit("cvs:parsed_successfully", { cvId, updatedCv: errorCv });

                Logger.error(
                    `CV parsing failed for CV ID: ${cvId}`,
                    error.stack,
                    'CvParsingProcessor',
                );

                throw error; // BullMQ retry
            }
        }
    }
}