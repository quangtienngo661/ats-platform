'use server';

import { revalidatePath } from 'next/cache';
import { actionErrorMessage, rethrowReadError } from '@/lib/action-error';
import http from '@/lib/http';
import type { IAiCostSummary, IModelPrice, IRecruitmentAnalytics } from '@/types/interfaces/analytics.interface';

export interface AnalyticsQuery {
    from?: string;
    to?: string;
    jobId?: string;
}

const params = (query: AnalyticsQuery) =>
    Object.fromEntries(Object.entries(query).filter(([, value]) => Boolean(value)));

export async function getRecruitmentAnalyticsAction(query: AnalyticsQuery): Promise<IRecruitmentAnalytics> {
    try {
        const response = await http.get('/analytics/recruitment', { params: params(query) });
        return response.data as unknown as IRecruitmentAnalytics;
    } catch (error) {
        rethrowReadError(error, 'Không tải được thống kê tuyển dụng. Thử lại sau.');
    }
}

export async function getAiCostAction(query: Pick<AnalyticsQuery, 'from' | 'to'>): Promise<IAiCostSummary> {
    try {
        const response = await http.get('/analytics/ai-cost', { params: params(query) });
        return response.data as unknown as IAiCostSummary;
    } catch (error) {
        rethrowReadError(error, 'Không tải được chi phí AI. Thử lại sau.');
    }
}

export async function getModelPricesAction(): Promise<IModelPrice[]> {
    try {
        const response = await http.get('/analytics/ai-model-prices');
        return (response.data as unknown as IModelPrice[]) ?? [];
    } catch (error) {
        rethrowReadError(error, 'Không tải được bảng giá model. Thử lại sau.');
    }
}

export type ModelPriceActionState = { success: boolean; message: string };

const PRICE_PATTERN = /^\d{1,6}(\.\d{1,4})?$/;
const PRICE_MESSAGE = 'Giá phải là số từ 0 đến 100000, tối đa 4 chữ số thập phân.';

/** Form action: the model name and both prices come from the row's form. */
export async function setModelPriceAction(
    _prev: ModelPriceActionState,
    formData: FormData,
): Promise<ModelPriceActionState> {
    const modelName = String(formData.get('modelName') ?? '').trim();
    const input = String(formData.get('inputUsdPerMillion') ?? '').trim().replace(',', '.');
    const output = String(formData.get('outputUsdPerMillion') ?? '').trim().replace(',', '.');
    if (!modelName) return { success: false, message: 'Thiếu tên model.' };
    if (!PRICE_PATTERN.test(input) || !PRICE_PATTERN.test(output) || Number(input) > 100000 || Number(output) > 100000) {
        return { success: false, message: PRICE_MESSAGE };
    }
    try {
        await http.put(`/analytics/ai-model-prices/${encodeURIComponent(modelName)}`, {
            inputUsdPerMillion: Number(input),
            outputUsdPerMillion: Number(output),
        });
        revalidatePath('/ai-usage-logs');
        revalidatePath('/dashboard');
        return { success: true, message: `Đã lưu giá cho ${modelName}.` };
    } catch (error) {
        return { success: false, message: actionErrorMessage(error, 'Không lưu được giá. Thử lại sau.') };
    }
}
