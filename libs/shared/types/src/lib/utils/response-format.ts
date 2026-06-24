export interface ResponseFormat<T = unknown> {
    success: boolean;
    status: number;
    message?: string;
    data?: T;
}

export const successResponse = <T = unknown>(status = 200, data?: T): ResponseFormat<T> => {
    return {
        success: true,
        status,
        data,
    };
}

export const errorResponse = <T = unknown>(
    status = 500,
    message = "Lỗi máy chủ nội bộ",
    data?: T
): ResponseFormat<T> => {
    return {
        success: false,
        status,
        message,
        data,
    };
}
