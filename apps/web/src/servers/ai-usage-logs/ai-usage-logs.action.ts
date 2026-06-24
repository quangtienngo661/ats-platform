"use server";

import http from "@/lib/http";
import { IAiUsageLogDto } from "@/types/interfaces/ai-usage-log.interface";
import { IPaginatedResponse } from "@ats-platform/types";

export type AiUsageLogState = {
    success: boolean;
    message: string;
};

export type IAiUsageLogResponse = IPaginatedResponse<IAiUsageLogDto>;

export const getAIUsageLogsAction = async (page = 1): Promise<IAiUsageLogResponse | AiUsageLogState> => {
    try {
        const response = await http.get(`/ai-usage-logs?page=${page}`);
        return response.data as IAiUsageLogResponse;
    } catch {
        return {
            items: [],
            pagination: {
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0
            }
        };
    }
};