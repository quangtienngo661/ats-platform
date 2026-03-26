import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { MailService } from "../mail.service";
import { Logger } from "@nestjs/common";

@Processor('send-verification-email')
export class SendVerificationProcessor extends WorkerHost {
    constructor(private readonly mailService: MailService) {
        super();
    }
    async process(job: Job) {
        if (job.name === 'send-register-verification-email') {
            const { email, link } = job.data;
            await this.mailService.sendVerificationEmail(email, link);
            Logger.log(`Send verification email successfully!`);
        }
    }
}