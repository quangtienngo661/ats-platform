import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT guard that degrades to "anonymous" instead of rejecting, so one endpoint can
 * serve both guests and logged-in users and let the handler decide what each sees.
 *
 * Only genuine auth failures degrade (no token, bad signature, expired, deactivated
 * account). Anything else — a DB outage inside JwtStrategy, for instance — must
 * propagate: silently treating a recruiter as a guest would hide their own drafts
 * behind a 200 OK instead of surfacing the outage.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: unknown, user: TUser): TUser | undefined {
    if (err && !(err instanceof UnauthorizedException)) {
      throw err;
    }

    return user || undefined;
  }
}
