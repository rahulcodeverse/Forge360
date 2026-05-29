import { Body, Controller, Get, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { JwtPayload } from '@hrms/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('headcount')
  @Roles('hr_admin', 'hr_manager', 'manager', 'super_admin')
  getHeadcount(@CurrentUser() user: JwtPayload) {
    return this.reportsService.getHeadcountSummary(user.tenantId);
  }

  @Get('salary-register')
  @Roles('hr_admin', 'super_admin')
  getSalaryRegister(
    @CurrentUser() user: JwtPayload,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.reportsService.getSalaryRegister(user.tenantId, month, year);
  }

  @Get('leave-liability')
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  getLeaveLiability(
    @CurrentUser() user: JwtPayload,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.reportsService.getLeaveLiability(user.tenantId, year);
  }

  @Post('export')
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  queueExport(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      reportType: string;
      format: 'csv' | 'pdf';
      recipientEmail: string;
      filters?: Record<string, unknown>;
    },
  ) {
    return this.reportsService.queueExport(
      user.tenantId,
      body.reportType,
      body.filters ?? {},
      body.format,
      body.recipientEmail,
    );
  }
}
