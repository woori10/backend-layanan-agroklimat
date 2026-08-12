import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/role.decorators';

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        if (!user) {
            throw new ForbiddenException('Anda tidak memiliki akses');
        }

        // Map role alias 'admin_petugas_layanan' to both 'admin' and 'pegawai'
        const resolvedRoles = requiredRoles.flatMap((role) =>
            role === 'admin_petugas_layanan' ? ['admin', 'pegawai'] : [role]
        );

        if (!resolvedRoles.includes(user.role)) {
            throw new ForbiddenException('Anda tidak memiliki akses');
        }
        return true;
    }
}


