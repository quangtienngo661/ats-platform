import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  Req,
  Redirect,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResponseFormat, successResponse } from '@ats-platform/types';
import { LoginDto, RegisterDto, RequestEmailVerificationDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto } from './dtos/auth.dto';
import { Request, Response } from 'express';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, refreshTokenId } = await this.authService.login(loginDto);

    res.cookie('refreshToken', `${refreshTokenId}.${refreshToken}`,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    );

    return { accessToken };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return result;
  }

  @Post('refresh')
  async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const accessToken = await this.authService.refreshToken(req, res);
    if (!accessToken) {
      throw new UnauthorizedException('Could not refresh token');
    }
    return { accessToken };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req, res);
    return { message: 'Logout successful' };
  }

  @Post('request-email-verification')
  async requestEmailVerification(@Body() dto: RequestEmailVerificationDto) {
    const result = await this.authService.requestEmailVerification(dto.email, dto.type);
    return result;
  }

  @Get('verify-email')
  async verifyEmail(
    @Res() res: Response,
    @Query('token') token?: string,
    @Query('type') type?: string,
  ) {
    const result = await this.authService.verifyEmail(token ?? '', type ?? '');
    // return { url: result.redirectUrl, statusCode: 302 };
    return res.redirect(302, result.redirectUrl);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto.email);
    return result;
  }

  @Post('reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.resetPassword(dto.token, dto.password, req, res);
    return result;
  }
}
