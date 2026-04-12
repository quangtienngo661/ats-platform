import { UserRole } from '@ats-platform/database';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext) {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ])
        // console.log('RolesGuard debugging ');

        if (!requiredRoles) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (user.role === UserRole.admin) {
            return true;
        }

        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException('You do not have permission to access this resource');
        }

        return true;
    }
}