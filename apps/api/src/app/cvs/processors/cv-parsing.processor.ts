import { Processor, WorkerHost } from "@nestjs/bullmq";
import { GeminiService } from "../../../common/external-apis/gemini/gemini.service";
import { Job } from "bullmq";
import { CvParsedDataService } from "../cv-parsed-data/cv-parsed-data.service";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { ParsingStatus } from "@ats-platform/database";
import { Logger } from "@nestjs/common";
import { CV_PARSING_PROMPT } from "../../../common/constants/gemini-api";

@Processor('cv-processing')
export class CvParsingProcessor extends WorkerHost {
    constructor(
        private readonly cvParsedDataService: CvParsedDataService,
        private readonly geminiService: GeminiService,
        private readonly prisma: PrismaService
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
                    await tx.cV.update({
                        where: { cvId },
                        data: { parsingStatus: ParsingStatus.success },
                    });
                });

                // 5. TODO: Socket notification
                Logger.log(
                    `CV parsing completed for CV ID: ${cvId}`,
                    'CvParsingProcessor',
                );

            } catch (error) {
                // 6. Update failed + ghi error log
                await this.prisma.cV.update({
                    where: { cvId },
                    data: {
                        parsingStatus: ParsingStatus.failed,
                        errorLog: error.message,
                    },
                });

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