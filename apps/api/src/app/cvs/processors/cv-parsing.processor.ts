import { CvParsedContent } from "@ats-platform/types";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { GeminiService } from "apps/api/src/common/external-apis/gemini/gemini.service";
import { Job } from "bullmq";
import { CvParsedDataService } from "../cv-parsed-data/cv-parsed-data.service";
import { CV_PARSE_PROMPT } from "apps/api/src/common/constants/gemini-api";
import { CVsService } from "../cvs.service";
import { PrismaService } from "apps/api/src/common/prisma/prisma.service";
import { ParsingStatus } from "@ats-platform/database";
import { Logger } from "@nestjs/common";

@Processor('cv-processing')
export class CvParsingProcessor extends WorkerHost {
    constructor(
        private readonly cvParsedDataService: CvParsedDataService,
        private readonly geminiService: GeminiService,
        private readonly prisma: PrismaService
    ) {
        super();
    }

    // async process(job: Job): Promise<any> {
    //     if (job.name === 'parse-cv') {
    //         const { cvId, rawTextFromCV } = job.data;

    //         const parsedData: CvParsedContent = await this.geminiService.parseCV(CV_PARSE_PROMPT, rawTextFromCV);
    //         await this.cvParsedDataService.create(cvId, parsedData);
    //         // TODO: Implement socket notification to candidate about CV parsing completion

    //         await this.prisma.cV.update({
    //             where: { cvId: cvId },
    //             data: { parsingStatus: ParsingStatus.success },
    //         });

    //         Logger.log(`CV parsing completed for CV ID: ${cvId}`, 'CvParsingProcessor');
    //     }
    // }

    async process(job: Job): Promise<any> {
        if (job.name === 'parse-cv') {
            const { cvId, rawTextFromCV } = job.data;

            // 1. Update status → processing
            await this.prisma.cV.update({
                where: { cvId },
                data: { parsingStatus: ParsingStatus.processing },
            });

            try {
                // 2. Gọi Gemini parse
                const parsedData: CvParsedContent = await this.geminiService.parseCV(
                    CV_PARSE_PROMPT,
                    rawTextFromCV,
                );

                // 3. Lưu DB trong transaction
                await this.prisma.$transaction(async (tx) => {
                    await this.cvParsedDataService.create(cvId, parsedData, tx);
                    await tx.cV.update({
                        where: { cvId },
                        data: { parsingStatus: ParsingStatus.success },
                    });
                });

                // 4. TODO: Socket notification
                Logger.log(`CV parsing completed for CV ID: ${cvId}`, 'CvParsingProcessor');

            } catch (error) {
                // 5. Update failed + ghi error log
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