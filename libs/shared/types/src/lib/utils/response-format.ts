export interface ResponseFormat {
    success: boolean;
    status: number;
    message: string;
    data?: any;
}

export const successResponse = (status: number = 200, message: string, data?: any): ResponseFormat => {
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
    data?: any
): ResponseFormat => {
    return {
        success: false,
        status,
        message,
        data, 
    };
}