export interface ResponseFormat<T = unknown> {
    success: boolean;
    status: number;
    message?: string;
    data?: T;
}

export const successResponse = (status: number = 200, data?: any): ResponseFormat => {
    return {
        success: true,
        status,
        data,
    };
}

export const errorResponse = (
    status: number = 500,
    message: string = "Lỗi máy chủ nội bộ",
    data?: unknown
): ResponseFormat => {
    return {
        success: false,
        status,
        message,
    };
}
