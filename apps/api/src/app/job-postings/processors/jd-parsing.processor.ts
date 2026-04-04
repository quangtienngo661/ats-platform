import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { JD_PARSING_PROMPT } from "../../../common/constants/gemini-api";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { GeminiService } from "../../../common/external-apis/gemini/gemini.service";

@Processor('jd-parsing')
export class JDProcessingProcessor extends WorkerHost {
    private readonly logger = new Logger(JDProcessingProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly geminiService: GeminiService
    ) {
        super();
    }

    async process(job: Job) {
        if (job.name == 'parse-jd') {
            const { jobId } = job.data;
            this.logger.log(`Processing parse-jd for jobId: ${jobId}`);

            const jobPosting = await this.prisma.jobPosting.findUnique({
                where: { jobId }
            });

            if (!jobPosting) {
                const errorMsg = `JobPosting with ID ${jobId} not found`;
                this.logger.error(errorMsg);
                throw new Error(errorMsg);
            }

            if (!jobPosting.description) {
                this.logger.warn(`JobPosting with ID ${jobId} has no description. Skipping parse.`);
                return;
            }

            try {
                const parsedData = await this.geminiService.parseJD(
                    jobPosting.jobId,
                    jobPosting.description,
                );

                await this.prisma.jobPosting.update({
                    where: {
                        jobId: jobPosting.jobId
                    },
                    data: {
                        parsedRequirements: parsedData
                    }
                });

                this.logger.log(`Successfully parsed JD for jobId: ${jobId}`);
            } catch (error) {
                this.logger.error(
                    `Failed to parse JD for jobId: ${jobId}`,
                    error instanceof Error ? error.stack : undefined
                );
                // Ném lỗi ra ngoài để BullMQ ghi nhận Job thất bại và tự động retry
                throw error;
            }
        }
    }
}