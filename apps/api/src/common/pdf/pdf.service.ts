import { Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse'

@Injectable()
export class PdfService {
    async parsePdf(fileBuffer: Buffer) {
        try {
            const data = new PDFParse(new Uint8Array(fileBuffer));
            return (await data.getText()).text;
        } catch (error) {
            console.error('Error parsing PDF:', error);
        }
    }
}
