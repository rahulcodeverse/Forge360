import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

import type { JwtPayload } from '@hrms/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';

class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() tenantSlug!: string;
  @IsOptional() @IsString() totpCode?: string;
}

class ForgotPasswordDto {
  @IsEmail() email!: string;
  @IsString() tenantSlug!: string;
}

class ResetPasswordDto {
  @IsString() token!: string;
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  password!: string;
}

class ConfirmMfaDto {
  @IsString() totpCode!: string;
}

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email + password (+ optional MFA)' })
  @ApiBody({ type: LoginDto })
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip;

    // Resolve tenantSlug → tenantId
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: body.tenantSlug } });
    if (!tenant) throw new NotFoundException(`Workspace "${body.tenantSlug}" not found`);

    const user = await this.authService.validateUser(body.email, body.password, tenant.id);
    const result = await this.authService.login(user.id, tenant.id, body.totpCode, ip);

    if ('requiresMfa' in result && result.requiresMfa) {
      return { requiresMfa: true };
    }

    const loginResult = result as Exclude<typeof result, { requiresMfa: true }>;

    // Set refresh token as httpOnly cookie
    res.cookie('hrms_rt', loginResult.refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return {
      requiresMfa: false,
      accessToken: loginResult.accessToken,
      tenantId: loginResult.tenantId,
      user: loginResult.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using httpOnly refresh token cookie' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['hrms_rt'] as string | undefined;
    if (!refreshToken) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No refresh token' } });
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    res.cookie('hrms_rt', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Revoke refresh token and clear cookie' })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['hrms_rt'] as string ?? '';
    await this.authService.logout(user.sub, refreshToken, req.ip);
    res.clearCookie('hrms_rt');
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Request password reset email' })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: body.tenantSlug } });
    if (!tenant) throw new NotFoundException(`Workspace "${body.tenantSlug}" not found`);
    await this.authService.requestPasswordReset(body.email, tenant.id);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset password with token from email' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.authService.resetPassword(body.token, body.password);
  }

  @Get('mfa/setup')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get TOTP QR code for MFA enrollment' })
  async setupMfa(@CurrentUser() user: JwtPayload) {
    return this.authService.setupMfa(user.sub);
  }

  @Post('mfa/confirm')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Confirm MFA enrollment with TOTP code' })
  async confirmMfa(@CurrentUser() user: JwtPayload, @Body() body: ConfirmMfaDto) {
    await this.authService.confirmMfa(user.sub, body.totpCode);
  }

  @Delete('mfa')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disable MFA (requires valid TOTP code)' })
  async disableMfa(@CurrentUser() user: JwtPayload, @Body() body: ConfirmMfaDto) {
    await this.authService.disableMfa(user.sub, body.totpCode);
  }

  @Get('sessions')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List active sessions for current user' })
  getSessions(@CurrentUser() user: JwtPayload) {
    return this.authService.getSessions(user.sub);
  }

  @Delete('sessions/:id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a specific session' })
  revokeSession(@CurrentUser() user: JwtPayload, @Param('id') sessionId: string) {
    return this.authService.revokeSession(sessionId, user.sub);
  }
}
