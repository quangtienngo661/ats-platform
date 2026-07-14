import { UserStatus } from '@ats-platform/types';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../common/prisma/prisma.service';

const extractJwtFromCookieOrHeader = (req: Request) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    return req.headers.authorization.split(' ')[1];
  }

  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: extractJwtFromCookieOrHeader,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { userId?: string }) {
    if (!payload?.userId) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    // Re-read role/status from the DB on every request: a token minted before a
    // role change or a deactivation must not keep working until it expires.
    const user = await this.prisma.user.findUnique({
      where: { userId: payload.userId },
      select: { userId: true, role: true, fullName: true, status: true },
    });

    if (!user) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    if (user.status !== UserStatus.active) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }

    return { userId: user.userId, role: user.role, fullName: user.fullName };
  }
}
