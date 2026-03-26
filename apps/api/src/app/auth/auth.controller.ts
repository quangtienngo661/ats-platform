import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResponseFormat, successResponse } from '@ats-platform/types';
import { LoginDto, RegisterDto, RequestEmailVerificationDto, VerifyEmailDto } from './dtos/auth.dto';
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

  // @Post('request-email-verification')
  // async requestEmailVerification(@Body() dto: RequestEmailVerificationDto) {
  //   const result = await this.authService.requestEmailVerification(dto.email);
  //   return result;
  // }

  @Get('verify-email')
  async verifyEmail(@Query('token') token?: string) {
    const result = await this.authService.verifyEmail(token ?? '');
    return result.message;
  }
}
