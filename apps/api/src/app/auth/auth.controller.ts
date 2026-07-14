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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  RequestEmailVerificationDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dtos/auth.dto';
import { Request, Response } from 'express';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

@ApiTags('Xác thực')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(ThrottlerGuard)
  @Post('login')
  @ApiOperation({
    summary: 'Đăng nhập',
    description:
      'Xác thực người dùng bằng email và mật khẩu. Trả về accessToken và đặt refreshToken vào cookie.',
  })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không đúng' })
  @ApiResponse({
    status: 429,
    description: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, refreshTokenId } =
      await this.authService.login(loginDto);

    res.cookie('refreshToken', `${refreshTokenId}.${refreshToken}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken };
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  @ApiOperation({
    summary: 'Đăng ký tài khoản',
    description: 'Tạo tài khoản ứng viên mới và gửi email xác thực.',
  })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc email đã tồn tại',
  })
  @ApiResponse({
    status: 429,
    description: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
  })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return result;
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Làm mới token',
    description: 'Sử dụng refreshToken trong cookie để lấy accessToken mới.',
  })
  @ApiResponse({ status: 200, description: 'Làm mới thành công' })
  @ApiResponse({
    status: 401,
    description: 'RefreshToken không hợp lệ hoặc đã hết hạn',
  })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const accessToken = await this.authService.refreshToken(req, res);
    if (!accessToken) {
      throw new UnauthorizedException('Không thể làm mới phiên đăng nhập');
    }
    return { accessToken };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('logout')
  @ApiOperation({
    summary: 'Đăng xuất',
    description: 'Thu hồi refreshToken và xóa cookie phiên đăng nhập.',
  })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req, res);
    return { message: 'Đăng xuất thành công' };
  }

  @Post('request-email-verification')
  @ApiOperation({
    summary: 'Gửi email xác thực',
    description: 'Gửi lại email xác thực hoặc email đặt lại mật khẩu.',
  })
  @ApiResponse({ status: 200, description: 'Email đã được gửi' })
  async requestEmailVerification(@Body() dto: RequestEmailVerificationDto) {
    const result = await this.authService.requestEmailVerification(
      dto.email,
      dto.type,
    );
    return result;
  }

  @Get('verify-email')
  @ApiOperation({
    summary: 'Xác thực email',
    description:
      'Xác thực email qua token gửi trong URL. Redirect về client sau khi xác thực.',
  })
  @ApiQuery({ name: 'token', required: false, description: 'Token xác thực' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Loại xác thực (verify | reset)',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect về trang kết quả xác thực',
  })
  async verifyEmail(
    @Res() res: Response,
    @Query('token') token?: string,
    @Query('type') type?: string,
  ) {
    const result = await this.authService.verifyEmail(token ?? '', type ?? '');
    return res.redirect(302, result.redirectUrl);
  }

  @UseGuards(ThrottlerGuard)
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Quên mật khẩu',
    description: 'Gửi email chứa link đặt lại mật khẩu.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email đặt lại mật khẩu đã được gửi',
  })
  @ApiResponse({
    status: 429,
    description: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto.email);
    return result;
  }

  @UseGuards(ThrottlerGuard)
  @Post('reset-password')
  @ApiOperation({
    summary: 'Đặt lại mật khẩu',
    description: 'Đặt lại mật khẩu bằng token từ email.',
  })
  @ApiResponse({ status: 200, description: 'Đặt lại mật khẩu thành công' })
  @ApiResponse({
    status: 400,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.resetPassword(
      dto.token,
      dto.password,
      req,
      res,
    );
    return result;
  }
}
