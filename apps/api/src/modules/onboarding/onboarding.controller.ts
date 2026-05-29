import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

import type { JwtPayload } from '@hrms/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { OnboardingService } from './onboarding.service';

class CreateOnboardingBody {
  @IsOptional() @IsUUID() employeeId?: string;
  @IsOptional() @IsInt() @Min(1) totalSteps?: number;
}

class UpdateOnboardingStepBody {
  data!: Record<string, unknown>;
  @IsOptional() @IsBoolean() markComplete?: boolean;
}

@ApiTags('onboarding')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ path: 'onboarding', version: '1' })
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('sessions')
  @Roles('hr_admin', 'hr_manager', 'manager', 'super_admin')
  @ApiOperation({ summary: 'List onboarding sessions with employee context' })
  list(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return this.onboardingService.list(user.tenantId, query);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get current employee onboarding session' })
  mine(@CurrentUser() user: JwtPayload) {
    return this.onboardingService.mine(user.tenantId, user.employeeId);
  }

  @Post('sessions')
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  @ApiOperation({ summary: 'Start an onboarding session' })
  create(@CurrentUser() user: JwtPayload, @Body() body: CreateOnboardingBody) {
    return this.onboardingService.create(user.tenantId, body.employeeId, body.totalSteps ?? 8);
  }

  @Patch('sessions/:id/steps/:step')
  @ApiOperation({ summary: 'Save one onboarding wizard step independently' })
  saveStep(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('step') step: string,
    @Body() body: UpdateOnboardingStepBody,
  ) {
    return this.onboardingService.saveStep(
      user.tenantId,
      id,
      Number(step),
      body.data,
      body.markComplete ?? false,
    );
  }

  @Post('sessions/:id/complete')
  @ApiOperation({ summary: 'Mark onboarding session as complete' })
  complete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.onboardingService.complete(user.tenantId, id);
  }
}
