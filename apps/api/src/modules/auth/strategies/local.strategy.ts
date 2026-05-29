import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Request } from 'express';

import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    email: string,
    password: string,
  ): Promise<{ id: string; tenantId: string }> {
    const tenantId = req.body.tenantId as string | undefined;

    if (!tenantId) {
      throw new UnauthorizedException('tenantId is required');
    }

    const user = await this.authService.validateUser(email, password, tenantId);
    return { id: user.id, tenantId };
  }
}
