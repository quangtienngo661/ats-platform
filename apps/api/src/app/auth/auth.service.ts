import { BadRequestException, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { LoginDto, RegisterDto, Role } from '@ats-platform/types';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../../common/utils/jwtService';
import { Request, Response } from 'express';
import { createHmac, randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import Redis from 'ioredis';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis
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

  private buildEmailVerificationLink(token: string) {
    return `${this.apiBaseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;
  }

  private async issueEmailVerification(userId: string, email: string) {
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashEmailVerificationToken(token);
    const ttlSeconds = Math.ceil(this.emailVerificationTtlMs / 1000);

    const tokenKey = `${this.emailVerifyKeyPrefix}${tokenHash}`;
    const userKey = `${this.emailVerifyUserKeyPrefix}${userId}`;

    // Keep only one active token per user.
    const previousHash = await this.redisClient.get(userKey);
    if (previousHash) {
      await this.redisClient.del(`${this.emailVerifyKeyPrefix}${previousHash}`);
    }

    await this.redisClient.set(tokenKey, userId, 'EX', ttlSeconds);
    await this.redisClient.set(userKey, tokenHash, 'EX', ttlSeconds);

    const link = this.buildEmailVerificationLink(token);
    try {
      await this.mailService.sendVerificationEmail(email, link);
    } catch (err) {
      await this.redisClient.del(tokenKey);
      await this.redisClient.del(userKey);
      throw err;
    }
  }

  async login(loginDto: LoginDto) {
    if (!loginDto.email || !loginDto.password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }

    const isPasswordValid = bcrypt.compareSync(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }

    const accessToken = generateAccessToken(user.userId, Role[user.role.toUpperCase()]);
    const refreshToken = generateRefreshToken(user.userId, Role[user.role.toUpperCase()]);
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

    if (user) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = bcrypt.hashSync(registerDto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash: hashedPassword,
        fullName: registerDto.fullName,
        role: 'candidate',
        status: 'active',
      },
    });

    try {
      await this.issueEmailVerification(newUser.userId, newUser.email);
    } catch (err: any) {
      this.logger.warn(`Could not send verification email: ${err?.message ?? err}`);
    }

    return {
      message: 'User registered successfully',
      user: {
        userId: newUser.userId,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        status: newUser.status,
      }
    };
  }

  async requestEmailVerification(email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Do not reveal whether email exists.
    if (!user) {
      return { message: 'If an account exists, a verification email has been sent' };
    }

    if ((user as any).emailVerified === true) {
      return { message: 'Email already verified' };
    }

    try {
      await this.issueEmailVerification(user.userId, user.email);
    } catch (err: any) {
      this.logger.warn(`Could not send verification email: ${err?.message ?? err}`);
    }

    // Always return a generic message to avoid leaking account state.
    return { message: 'If an account exists, a verification email has been sent' };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const tokenHash = this.hashEmailVerificationToken(token);
    const tokenKey = `${this.emailVerifyKeyPrefix}${tokenHash}`;

    const userId = await this.redisClient.get(tokenKey);
    if (!userId) {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await this.prisma.user.findUnique({ where: { userId } });
    if (!user) {
      // Defensive: token exists but user not found
      await this.redisClient.del(tokenKey);
      throw new BadRequestException('Invalid or expired token');
    }

    if ((user as any).emailVerified === true) {
      // Still delete token so it can't be replayed.
      await this.redisClient.del(tokenKey);
      await this.redisClient.del(`${this.emailVerifyUserKeyPrefix}${userId}`);
      return { message: 'Email already verified' };
    }

    await this.prisma.user.update({
      where: { userId },
      data: { emailVerified: true },
    });

    await this.redisClient.del(tokenKey);
    await this.redisClient.del(`${this.emailVerifyUserKeyPrefix}${userId}`);

    return { message: 'Email verified successfully' };
  }

  async refreshToken(req: Request, res: Response) {
    const refreshCookieValue = req.cookies?.['refreshToken'];
    if (!refreshCookieValue || typeof refreshCookieValue !== 'string') {
      throw new UnauthorizedException('Refresh token is required');
    }

    const dotIndex = refreshCookieValue.indexOf('.');
    if (dotIndex <= 0) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshTokenId = refreshCookieValue.slice(0, dotIndex);
    const currentRefreshToken = refreshCookieValue.slice(dotIndex + 1);
    if (!currentRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenPayload = verifyToken(currentRefreshToken);
    if (!tokenPayload || typeof tokenPayload === 'string') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payloadUserId = (tokenPayload as any).userId as string | undefined;
    const payloadRoleRaw = (tokenPayload as any).role as string | undefined;
    if (!payloadUserId || !payloadRoleRaw) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const roleKey = payloadRoleRaw.toUpperCase() as keyof typeof Role;
    const payloadRole = Role[roleKey];
    if (!payloadRole) {
      throw new UnauthorizedException('Invalid refresh token');
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
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = generateAccessToken(payloadUserId, payloadRole);
    const newRefreshToken = generateRefreshToken(payloadUserId, payloadRole);
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

  // TODO: finish the forgot password flow with email verification and password reset token.
}
