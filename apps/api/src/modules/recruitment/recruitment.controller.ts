import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { JwtPayload } from '@hrms/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { RecruitmentService } from './recruitment.service';

@ApiTags('recruitment')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ path: 'recruitment', version: '1' })
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Get('requisitions')
  getRequisitions(
    @CurrentUser() user: JwtPayload,
    @Query() dto: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.recruitmentService.getRequisitions(user.tenantId, dto, status);
  }

  @Post('requisitions')
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  createRequisition(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>) {
    return this.recruitmentService.createRequisition(user.tenantId, user.sub, body as Parameters<RecruitmentService['createRequisition']>[2]);
  }

  @Get('applications')
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  getApplications(
    @CurrentUser() user: JwtPayload,
    @Query() dto: PaginationDto,
    @Query('stage') stage?: string,
  ) {
    return this.recruitmentService.getApplications(user.tenantId, dto, stage);
  }

  @Put('applications/:id/stage')
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  moveStage(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { stage: string },
  ) {
    return this.recruitmentService.moveStage(id, user.tenantId, body.stage, user.sub);
  }

  @Post('applications/:id/interviews')
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  scheduleInterview(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.recruitmentService.scheduleInterview(id, user.tenantId, body as Parameters<RecruitmentService['scheduleInterview']>[2]);
  }

  @Post('applications/:id/offers')
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  createOffer(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.recruitmentService.createOffer(id, user.tenantId, body as Parameters<RecruitmentService['createOffer']>[2]);
  }

  @Get('analytics')
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  getAnalytics(
    @CurrentUser() user: JwtPayload,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 90 * 86400000);
    const toDate = to ? new Date(to) : new Date();
    return this.recruitmentService.getRecruitmentAnalytics(user.tenantId, fromDate, toDate);
  }
}
