/** DTO đầu ra từ API cho một CV */
export interface ICvDto {
    cvId: string;
    candidateId: string;
    fileName: string;
    fileUrl?: string;
    status: string;
    createdAt: string;
}

/** Dữ liệu parsed của một CV */
export interface ICvParsedData {
    cvId: string;
    parsedData: Record<string, unknown>;
}
