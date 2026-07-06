import { BadRequestException } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
    let filter: GlobalExceptionFilter;
    let response: { status: jest.Mock; json: jest.Mock; headersSent: boolean };
    let request: { method: string; url: string };
    let loggerErrorSpy: jest.SpyInstance;

    const buildHost = () => ({
        switchToHttp: () => ({
            getResponse: () => response,
            getRequest: () => request,
        }),
    } as any);

    beforeEach(() => {
        filter = new GlobalExceptionFilter();
        response = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            headersSent: false,
        };
        request = { method: 'GET', url: '/api/whatever' };
        loggerErrorSpy = jest.spyOn((filter as any).logger, 'error').mockImplementation(() => undefined);
    });

    it('logs an error with stack trace for an unhandled 5xx exception', () => {
        const error = new Error('DB connection lost');

        filter.catch(error, buildHost());

        expect(loggerErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('DB connection lost'),
            error.stack,
        );
        expect(response.status).toHaveBeenCalledWith(500);
    });

    it('does not log a 4xx HttpException', () => {
        filter.catch(new BadRequestException('Dữ liệu không hợp lệ'), buildHost());

        expect(loggerErrorSpy).not.toHaveBeenCalled();
        expect(response.status).toHaveBeenCalledWith(400);
    });

    it('short-circuits without writing a response when headers are already sent', () => {
        response.headersSent = true;

        filter.catch(new Error('too late'), buildHost());

        expect(response.json).not.toHaveBeenCalled();
    });
});
