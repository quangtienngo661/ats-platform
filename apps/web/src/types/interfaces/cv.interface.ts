import { ICvParsedData } from "@ats-platform/types";

/** DTO đầu ra từ API cho một CV */
export interface ICvDto {
    cvId: string;
    candidateId: string;
    fileName: string;
    filePath: string;
    parsingStatus: 'pending' | 'processing' | 'completed' | 'failed';
    uploadedAt: string;
    parsedData: ICvParsedData | null;
}

