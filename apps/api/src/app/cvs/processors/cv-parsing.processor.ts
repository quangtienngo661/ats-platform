import { CvParsedContent } from "@ats-platform/types";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { GeminiService } from "apps/api/src/common/external-apis/gemini/gemini.service";
import { Job } from "bullmq";
import { CvParsedDataService } from "../cv-parsed-data/cv-parsed-data.service";
import { CV_PARSE_PROMPT } from "apps/api/src/common/constants/gemini-api";
import { Logger } from "@nestjs/common";

@Processor('cv-processing')
export class CvParsingProcessor extends WorkerHost {
    constructor(
        private readonly cvParsedDataService: CvParsedDataService,
        private readonly geminiService: GeminiService,
    ) {
        super();
    }

    async process(job: Job): Promise<any> {
        if (job.name === 'parse-cv') {
            const { cvId, rawTextFromCV } = job.data;

            const parsedData: CvParsedContent = await this.geminiService.parseCV(CV_PARSE_PROMPT, rawTextFromCV);
            await this.cvParsedDataService.create(cvId, parsedData);
            // TODO: Implement socket notification to candidate about CV parsing completion
            Logger.log(`CV with ID ${cvId} has been parsed and stored successfully.`);

        }
    }
}