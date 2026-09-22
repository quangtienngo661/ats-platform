import { UserRole } from '@ats-platform/database';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";

/**
 * The roles a caller satisfies. `org_admin ──▷ recruiter` (module spec, UC
 * generalization): an organization administrator may use every recruiter route,
 * and the services confine it to its own organization. Expressed once here rather
 * than by adding `org_admin` to every `@Roles(recruiter)` in the codebase.
 */
export function grantedRoles(role: UserRole): UserRole[] {
    return role === UserRole.org_admin
        ? [UserRole.org_admin, UserRole.recruiter]
        : [role];
}

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext) {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ])

        if (!requiredRoles) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        // Platform administrator: every route. Only `admin` gets this bypass —
        // `org_admin` is NOT a platform administrator and never takes this branch.
        if (user.role === UserRole.admin) {
            return true;
        }

        if (!grantedRoles(user.role).some((role) => requiredRoles.includes(role))) {
            throw new ForbiddenException('Bạn không có quyền truy cập tài nguyên này');
        }

        return true;
    }
}
