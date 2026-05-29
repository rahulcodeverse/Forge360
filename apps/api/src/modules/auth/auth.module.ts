import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { RbacService } from './rbac.service';
import { TotpService } from './totp.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') },
      }),
    }),
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy, JwtRefreshStrategy, RbacService, TotpService],
  controllers: [AuthController],
  exports: [AuthService, RbacService, JwtModule],
})
export class AuthModule {}
