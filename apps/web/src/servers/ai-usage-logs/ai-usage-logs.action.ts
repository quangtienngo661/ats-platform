import http from "@/lib/http"
import { IAiUsageLogDto } from "@/types/interfaces/ai-usage-log.interface"

export type AiUsageLogState = {
    success: boolean,
    message: string,
}

export interface IAiUsageLogPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface IAiUsageLogResponse {
    items: IAiUsageLogDto[];
    pagination: IAiUsageLogPagination;
}

export const getAIUsageLogsAction = async (page = 1): Promise<IAiUsageLogResponse | AiUsageLogState> => {
    try {
        const response = await http.get(`/ai-usage-logs?page=${page}`)
        return response.data;
    } catch (error) {
        return {
            success: false,
            message: 'Failed to get AI usage logs',
        }
    }
}