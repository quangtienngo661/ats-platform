import { Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse'

@Injectable()
export class PdfService {
    async parsePdf(fileBuffer: Buffer) {
        try {
            const data = new PDFParse(new Uint8Array(fileBuffer));
            // return {
            //     text: data.getText(),
            //     info: data.getInfo(),
            // };
            return await data.getText();
        } catch (error) {
            throw new Error('Error parsing PDF');
        }
    }
}
