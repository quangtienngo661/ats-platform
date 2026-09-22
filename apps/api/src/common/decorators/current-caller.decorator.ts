import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantCaller } from '../tenancy/tenant-caller';

/**
 * The authenticated caller, organization included, as JwtStrategy resolved it.
 * Use behind AuthGuard('jwt'): it reads what that guard put on `req.user`.
 */
export const CurrentCaller = createParamDecorator(
  (_data: unknown, context: ExecutionContext): TenantCaller => {
    const { user } = context.switchToHttp().getRequest();
    return {
      userId: user.userId,
      role: user.role,
      organizationId: user.organizationId ?? null,
    };
  },
);
