import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { LoginDto, RefreshTokenDto, RevokeSessionDto } from './auth.dto.js';
import { AuthService } from './auth.service.js';

@ApiTags('auth')
@ApiHeader({ name: 'X-Tenant-ID', required: true })
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Headers('x-tenant-id') tenantId: string, @Body() body: LoginDto) {
    return { data: this.auth.login({ tenantId, email: body.email, password: body.password }) };
  }

  @Post('refresh')
  refresh(@Body() body: RefreshTokenDto) {
    return { data: this.auth.refresh({ refreshToken: body.refreshToken }) };
  }

  @Post('sessions/revoke')
  revoke(@Body() body: RevokeSessionDto) {
    return { data: this.auth.revoke({ sessionId: body.sessionId }) };
  }

  @Get('me')
  me(@Headers('x-tenant-id') tenantId: string) {
    return { data: this.auth.me({ tenantId }) };
  }
}

