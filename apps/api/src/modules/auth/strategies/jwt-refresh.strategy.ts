import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          // Prefer httpOnly cookie, fall back to Authorization header
          return (req.cookies?.['hrms_rt'] as string | undefined) ??
            ExtractJwt.fromAuthHeaderAsBearerToken()(req) ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: { sub: string; tenantId: string; jti: string }) {
    const refreshToken =
      (req.cookies?.['hrms_rt'] as string | undefined) ??
      req.headers.authorization?.split(' ')[1];

    if (!refreshToken) throw new UnauthorizedException('Refresh token not found');

    return { ...payload, refreshToken };
  }
}
