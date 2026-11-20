import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    const artistAdminEmail = (process.env.ARTIST_ADMIN_EMAIL || 'artist@studio.vn').toLowerCase().trim();
    const isArtistAdmin = user.email && user.email.toLowerCase().trim() === artistAdminEmail;

    const hasRole =
      requiredRoles.includes(user.role) ||
      (isArtistAdmin && requiredRoles.includes(Role.ARTIST));

    if (!hasRole) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }
    return true;
  }
}
