import { ICvParsedData } from "@ats-platform/types";
export interface ICvDto {
    cvId: string;
    candidateId: string;
    fileName: string;
    filePath: string;
    parsingStatus: 'pending' | 'processing' | 'completed' | 'failed';
    uploadedAt: string;
    parsedData: ICvParsedData | null;
}

