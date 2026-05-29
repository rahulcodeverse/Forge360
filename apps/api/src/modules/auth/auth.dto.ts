import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsOptional()
  @IsString()
  totpCode?: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

export class RevokeSessionDto {
  @IsString()
  sessionId!: string;
}

