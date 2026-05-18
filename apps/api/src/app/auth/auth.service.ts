import { BadRequestException, Inject, Injectable, Logger, NotFoundException, Redirect, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@ats-platform/database';
import { LoginDto, RegisterDto } from './dtos/auth.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { createHmac, randomBytes } from 'crypto';
import Redis from 'ioredis';
import { JwtService } from '@nestjs/jwt';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CLIENT_URL } from '../../common/constants/urls';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    @InjectQueue('send-verification-email') private readonly emailQueue: Queue
  ) { }

  private get emailVerifyKeyPrefix() {
    return 'email_verify:';
  }

  private get emailVerifyUserKeyPrefix() {
    return 'email_verify_user:';
  }

  private get emailVerificationSecret() {
    const secret = process.env.EMAIL_VERIFICATION_TOKEN_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('EMAIL_VERIFICATION_TOKEN_SECRET (or JWT_SECRET fallback) is required');
    }
    return secret;
  }

  private get emailVerificationTtlMs() {
    const minutesRaw = process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES;
    const minutes = minutesRaw ? Number(minutesRaw) : 60 * 24;
    if (!Number.isFinite(minutes) || minutes <= 0) return 60 * 24 * 60 * 1000;
    return minutes * 60 * 1000;
  }

  private get apiBaseUrl() {
    const explicit = process.env.API_BASE_URL;
    if (explicit) return explicit.replace(/\/$/, '');
    const port = process.env.SERVER_PORT || 5000;
    return `http://localhost:${port}/api`;
  }

  private hashEmailVerificationToken(token: string) {
    return createHmac('sha256', this.emailVerificationSecret)
      .update(token)
      .digest('hex');
  }

  private buildEmailVerificationLink(token: string, type: string) {
    return `${this.apiBaseUrl}/auth/verify-email?type=${type}&token=${encodeURIComponent(token)}`;
  }

  private async issueEmailVerification(userId: string, email: string, jobName: string) {
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashEmailVerificationToken(token);
    const ttlSeconds = Math.ceil(this.emailVerificationTtlMs / 1000);

    const tokenKey = `${this.emailVerifyKeyPrefix}${tokenHash}`;
    const userKey = `${this.emailVerifyUserKeyPrefix}${userId}`;

    const previousHash = await this.redisClient.get(userKey);
    if (previousHash) {
      await this.redisClient.del(`${this.emailVerifyKeyPrefix}${previousHash}`);
    }

    await this.redisClient.set(tokenKey, userId, 'EX', ttlSeconds);
    await this.redisClient.set(userKey, tokenHash, 'EX', ttlSeconds);
    let link: string;
    if (jobName == "send-register-verification-email") {
      link = this.buildEmailVerificationLink(token, "verify");
    } else if (jobName == "send-forgot-password-email") {
      link = this.buildEmailVerificationLink(token, "reset");
    }

    try {
      await this.emailQueue.add(jobName, { email, link }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
    } catch (err) {
      await this.redisClient.del(tokenKey);
      await this.redisClient.del(userKey);
      throw err;
    }
  }

  async login(loginDto: LoginDto) {
    if (!loginDto.email || !loginDto.password) {
      throw new BadRequestException('Vui lòng nhập email và mật khẩu');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new BadRequestException('Email hoặc mật khẩu không đúng');
    }

    const isPasswordValid = bcrypt.compareSync(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new BadRequestException('Email hoặc mật khẩu không đúng');
    }

    if (!user.emailVerified) {
      throw new BadRequestException('EMAIL_NOT_VERIFIED:' + user.email);
    }

    const accessToken = await this.jwtService.signAsync({ userId: user.userId, role: user.role as UserRole, fullName: user.fullName });
    const refreshToken = await this.jwtService.signAsync({ userId: user.userId, role: user.role as UserRole, fullName: user.fullName }, { expiresIn: '7d' });
    const hashedRefreshToken = bcrypt.hashSync(refreshToken, 10);

    const newRefreshTokenRow = await this.prisma.refreshToken.create({
      data: {
        userId: user.userId,
        tokenHash: hashedRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        revoked: false,
      },
    });

    return { accessToken, refreshToken, refreshTokenId: newRefreshTokenRow.id };
  }

  async register(registerDto: RegisterDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (user && user.emailVerified === true) {
      throw new BadRequestException('Email đã tồn tại');
    } else if (user && user.emailVerified === false) {
      try {
        await this.issueEmailVerification(user.userId, user.email, 'send-register-verification-email');
        return { message: 'Email xác minh đã được gửi' };
      } catch (err: any) {
        this.logger.warn(`Could not send verification email: ${err?.message ?? err}`);
      }
    }

    const hashedPassword = bcrypt.hashSync(registerDto.password, 10);

    const newUser = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: registerDto.email,
          passwordHash: hashedPassword,
          fullName: registerDto.fullName,
          role: 'candidate',
          status: 'active',
        },
        omit: { passwordHash: true },
      });

      await tx.candidate.create({
        data: {
          userId: createdUser.userId,
        },
      });

      return createdUser;
    });

    try {
      await this.issueEmailVerification(newUser.userId, newUser.email, 'send-register-verification-email');
    } catch (err: any) {
      this.logger.warn(`Could not send verification email: ${err?.message ?? err}`);
    }

    return newUser;
  }

  async requestEmailVerification(email: string, type: string) {
    if (!email) {
      throw new BadRequestException('Vui lòng nhập email');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { message: 'Nếu tài khoản tồn tại, email xác minh đã được gửi' };
    }

    if ((user as any).emailVerified === true) {
      return { message: 'Email đã được xác minh' };
    }

    let jobName = 'send-register-verification-email';
    if (type === 'reset') {
      jobName = 'send-forgot-password-email';
    }

    try {
      await this.issueEmailVerification(user.userId, user.email, jobName);
    } catch (err: any) {
      this.logger.warn(`Could not send verification email: ${err?.message ?? err}`);
    }

    return { message: 'Nếu tài khoản tồn tại, email xác minh đã được gửi' };
  }

  async verifyEmail(token: string, type: string) {
    if (!token) {
      throw new BadRequestException('Thiếu mã xác minh');
    }

    const tokenHash = this.hashEmailVerificationToken(token);
    const tokenKey = `${this.emailVerifyKeyPrefix}${tokenHash}`;

    const userId = await this.redisClient.get(tokenKey);
    if (!userId) {
      throw new BadRequestException('Mã xác minh không hợp lệ hoặc đã hết hạn');
    }

    const user = await this.prisma.user.findUnique({ where: { userId } });
    if (!user) {
      // Defensive: token exists but user not found
      await this.redisClient.del(tokenKey);
      throw new BadRequestException('Mã xác minh không hợp lệ hoặc đã hết hạn');
    }

    if ((user as any).emailVerified === true) {
      // Still delete token so it can't be replayed.
      await this.redisClient.del(tokenKey);
      await this.redisClient.del(`${this.emailVerifyUserKeyPrefix}${userId}`);
      return { message: 'Email đã được xác minh', redirectUrl: `${CLIENT_URL}/sign-in` };
    }
    if (type === "verify") {
      await this.prisma.user.update({
        where: { userId },
        data: { emailVerified: true },
      });

      await this.redisClient.del(tokenKey);
      await this.redisClient.del(`${this.emailVerifyUserKeyPrefix}${userId}`);

      return { message: 'Xác minh email thành công', redirectUrl: `${CLIENT_URL}/verification-success` };
    }
    else if (type === "reset") {
      await this.redisClient.del(tokenKey);
      await this.redisClient.del(`${this.emailVerifyUserKeyPrefix}${userId}`);

      return { message: 'Yêu cầu đặt lại mật khẩu thành công', redirectUrl: `${CLIENT_URL}/reset-password?token=${token}` };
    }
  }

  async refreshToken(req: Request, res: Response) {
    const refreshCookieValue = req.cookies?.['refreshToken'];

    if (!refreshCookieValue || typeof refreshCookieValue !== 'string') {
      throw new UnauthorizedException('Thiếu refresh token');
    }
    const dotIndex = refreshCookieValue.indexOf('.');
    if (dotIndex <= 0) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const refreshTokenId = refreshCookieValue.slice(0, dotIndex);
    const currentRefreshToken = refreshCookieValue.slice(dotIndex + 1);

    if (!currentRefreshToken) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const tokenPayload = await this.jwtService.verifyAsync(currentRefreshToken);
    if (!tokenPayload || typeof tokenPayload === 'string') {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const payloadUserId = (tokenPayload as any).userId as string | undefined;
    const payloadRoleRaw = (tokenPayload as any).role as string | undefined;
    if (!payloadUserId || !payloadRoleRaw) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const payloadRole = UserRole[payloadRoleRaw];
    if (!payloadRole) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const existingToken = await this.prisma.refreshToken.findUnique({
      where: { id: refreshTokenId },
    });

    const now = new Date();
    const isTokenValid =
      !!existingToken &&
      existingToken.userId === payloadUserId &&
      existingToken.revoked === false &&
      existingToken.expiresAt > now &&
      bcrypt.compareSync(currentRefreshToken, existingToken.tokenHash);

    if (!isTokenValid) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const accessToken = await this.jwtService.signAsync({ userId: payloadUserId, role: payloadRole, fullName: tokenPayload.fullName });
    const newRefreshToken = await this.jwtService.signAsync({ userId: payloadUserId, role: payloadRole, fullName: tokenPayload.fullName }, { expiresIn: '7d' });
    const hashedNewRefreshToken = bcrypt.hashSync(newRefreshToken, 10);

    const newRefreshTokenRow = await this.prisma.refreshToken.create({
      data: {
        userId: payloadUserId,
        tokenHash: hashedNewRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        revoked: false,
      },
    });

    await this.prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { revoked: true },
    });

    res.cookie('refreshToken', `${newRefreshTokenRow.id}.${newRefreshToken}`,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    );

    return accessToken;
  }

  async logout(req: Request, res: Response) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
    };

    const refreshCookieValue = req.cookies?.['refreshToken'];
    if (refreshCookieValue && typeof refreshCookieValue === 'string') {
      const dotIndex = refreshCookieValue.indexOf('.');
      if (dotIndex > 0) {
        const refreshTokenId = refreshCookieValue.slice(0, dotIndex);
        const currentRefreshToken = refreshCookieValue.slice(dotIndex + 1);

        if (refreshTokenId && currentRefreshToken) {
          const existingToken = await this.prisma.refreshToken.findUnique({
            where: { id: refreshTokenId },
          });

          const isMatch =
            !!existingToken &&
            existingToken.revoked === false &&
            bcrypt.compareSync(currentRefreshToken, existingToken.tokenHash);

          if (isMatch) {
            await this.prisma.refreshToken.updateMany({
              where: { id: refreshTokenId, revoked: false },
              data: { revoked: true },
            });
          }
        }
      }
    }

    res.clearCookie('refreshToken', cookieOptions);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Không tìm thấy người dùng');
    }

    await this.issueEmailVerification(user.userId, user.email, 'send-forgot-password-email');

    return { message: 'Nếu tài khoản tồn tại, email đặt lại mật khẩu đã được gửi' };
  }

  async resetPassword(token: string, password: string, req: Request, res: Response) {
    const tokenHash = this.hashEmailVerificationToken(token);
    const tokenKey = `${this.emailVerifyKeyPrefix}${tokenHash}`;

    const userId = await this.redisClient.get(tokenKey);
    if (!userId) {
      throw new BadRequestException('Mã xác minh không hợp lệ hoặc đã hết hạn');
    }

    const user = await this.prisma.user.findUnique({ where: { userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    // Atomically update password + revoke ALL refresh tokens for this user
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { userId },
        data: { passwordHash: hashedPassword },
      });
      await tx.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
      });
    });

    // Clean up reset token from Redis
    await this.redisClient.del(tokenKey);
    await this.redisClient.del(`${this.emailVerifyUserKeyPrefix}${userId}`);

    // Clear the current cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { message: 'Đặt lại mật khẩu thành công. Tất cả phiên đăng nhập hiện tại đã được kết thúc.' };
  }
}
