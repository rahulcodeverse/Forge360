import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import type { JwtPayload } from '@hrms/shared-types';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<
      Request & { user: JwtPayload; tenantId: string }
    >();

    const tenantFromHeader = request.headers['x-tenant-id'] as string | undefined;
    const tenantFromJwt = request.user?.tenantId;

    if (!tenantFromJwt) {
      throw new UnauthorizedException('Tenant context missing from token');
    }

    if (tenantFromHeader && tenantFromHeader !== tenantFromJwt) {
      throw new UnauthorizedException('Tenant ID mismatch');
    }

    request.tenantId = tenantFromJwt;
    return true;
  }
}
