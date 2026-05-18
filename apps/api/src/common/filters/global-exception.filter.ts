import { errorResponse } from '@ats-platform/types';
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        // default: 500 with internal server error
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Lỗi máy chủ nội bộ';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            // take the exact message when an error is thrown
            message =
                typeof exceptionResponse === 'string'
                    ? exceptionResponse
                    : (exceptionResponse as any).message || exception.message;
        }

        // Nếu response đã được gửi (ví dụ: res.redirect()), không cố ghi thêm
        if (response.headersSent) {
            return;
        }

        response.status(status).json({ ...errorResponse(status, message) })
    }
}
