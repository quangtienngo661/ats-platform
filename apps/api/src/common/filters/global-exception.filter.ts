import { errorResponse } from '@ats-platform/types';
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

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

        // Chỉ log lỗi 5xx (bug thật/dependency fail) — 4xx là expected, đã có message trả về client
        if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
            const stack = exception instanceof Error ? exception.stack : undefined;
            const detail = exception instanceof Error ? exception.message : String(exception);
            this.logger.error(
                `Unhandled exception on ${request.method} ${request.url}: ${detail}`,
                stack,
            );
        }

        // Nếu response đã được gửi (ví dụ: res.redirect()), không cố ghi thêm
        if (response.headersSent) {
            return;
        }

        response.status(status).json({ ...errorResponse(status, message) })
    }
}
