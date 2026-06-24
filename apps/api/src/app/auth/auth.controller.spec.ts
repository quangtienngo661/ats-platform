import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { mockRequest, mockResponse } from '../../test-utils/unit-test-helpers';

describe('AuthController', () => {
  it('sets refresh cookie on login and returns only access token', async () => {
    const service = {
      login: jest.fn().mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
        refreshTokenId: 'rt-1',
      }),
    };
    const controller = new AuthController(service as any);
    const res = mockResponse();

    await expect(controller.login({ email: 'a@test.com', password: 'secret' }, res)).resolves.toEqual({
      accessToken: 'access',
    });

    expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'rt-1.refresh', expect.any(Object));
  });

  it('wraps refresh token results and rejects falsy service responses', async () => {
    const service = { refreshToken: jest.fn().mockResolvedValue('access') };
    const controller = new AuthController(service as any);

    await expect(controller.refreshToken(mockRequest(), mockResponse())).resolves.toEqual({ accessToken: 'access' });

    service.refreshToken.mockResolvedValueOnce(undefined);
    await expect(controller.refreshToken(mockRequest(), mockResponse())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('delegates logout and email/password flows', async () => {
    const service = {
      logout: jest.fn(),
      register: jest.fn(),
      requestEmailVerification: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
    };
    const controller = new AuthController(service as any);
    const req = mockRequest();
    const res = mockResponse();

    await expect(controller.logout(req, res)).resolves.toEqual({ message: expect.any(String) });
    await controller.register({ email: 'a@test.com' } as any);
    await controller.requestEmailVerification({ email: 'a@test.com', type: 'verify' } as any);
    await controller.forgotPassword({ email: 'a@test.com' } as any);
    await controller.resetPassword({ token: 'token', password: 'secret' } as any, req, res);

    expect(service.logout).toHaveBeenCalledWith(req, res);
    expect(service.register).toHaveBeenCalledWith({ email: 'a@test.com' });
    expect(service.requestEmailVerification).toHaveBeenCalledWith('a@test.com', 'verify');
    expect(service.forgotPassword).toHaveBeenCalledWith('a@test.com');
    expect(service.resetPassword).toHaveBeenCalledWith('token', 'secret', req, res);
  });

  it('redirects verify-email requests to the service redirect url', async () => {
    const service = { verifyEmail: jest.fn().mockResolvedValue({ redirectUrl: 'https://client/success' }) };
    const controller = new AuthController(service as any);
    const res = mockResponse();

    await controller.verifyEmail(res, 'token', 'verify');

    expect(service.verifyEmail).toHaveBeenCalledWith('token', 'verify');
    expect(res.redirect).toHaveBeenCalledWith(302, 'https://client/success');
  });
});
