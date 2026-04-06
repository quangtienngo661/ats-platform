export interface ResponseFormat<T = unknown> {
    success: boolean;
    status: number;
    message: string;
    data?: T;
}

export const successResponse = <T = unknown>(status: number = 200, message: string, data?: T): ResponseFormat<T> => {
    return {
        success: true,
        status,
        message,
        data,
    };
}

export const errorResponse = (
    status: number = 500,
    message: string = "Internal Server Error",
    data?: unknown
): ResponseFormat => {
    return {
        success: false,
        status,
        message,
        data,
    };
}