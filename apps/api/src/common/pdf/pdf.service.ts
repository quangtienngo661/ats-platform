import { Injectable, Logger } from '@nestjs/common';
import { PDFParse } from 'pdf-parse'

@Injectable()
export class PdfService {
    private readonly logger = new Logger(PdfService.name);

    async parsePdf(fileBuffer: Buffer) {
        try {
            const data = new PDFParse(new Uint8Array(fileBuffer));
            return (await data.getText()).text;
        } catch (error) {
            this.logger.error('Lỗi khi phân tích PDF:', error);
        }
    }
}
