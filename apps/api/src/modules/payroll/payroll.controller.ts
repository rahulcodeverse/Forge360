import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsInt, IsNumber, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

import type { JwtPayload } from '@hrms/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PayrollService } from './payroll.service';

class RunPayrollBody {
  @Type(() => Number) @IsInt() @Min(1) @Max(12) month!: number;
  @Type(() => Number) @IsNumber() @Min(2000) year!: number;
}

@ApiTags('payroll')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ path: 'payroll', version: '1' })
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('runs')
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  @ApiOperation({ summary: 'List all payroll runs' })
  getRuns(@CurrentUser() user: JwtPayload) {
    return this.payrollService.getRuns(user.tenantId);
  }

  @Post('runs')
  @Roles('hr_admin', 'super_admin')
  @ApiOperation({ summary: 'Trigger a new payroll run' })
  triggerRun(@CurrentUser() user: JwtPayload, @Body() body: RunPayrollBody) {
    return this.payrollService.triggerRun(user.tenantId, user.sub, body.month, body.year);
  }

  @Get('runs/:runId')
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  @ApiOperation({ summary: 'Get payroll run details and register' })
  getRun(@CurrentUser() user: JwtPayload, @Param('runId') runId: string) {
    return this.payrollService.getRun(runId, user.tenantId);
  }

  @Post('runs/:runId/approve')
  @Roles('hr_admin', 'super_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a processed payroll run' })
  approveRun(@CurrentUser() user: JwtPayload, @Param('runId') runId: string) {
    return this.payrollService.approveRun(runId, user.tenantId, user.sub);
  }

  @Get('payslips/mine')
  @ApiOperation({ summary: 'Get my payslips (last 24 months)' })
  getMyPayslips(@CurrentUser() user: JwtPayload) {
    return this.payrollService.getMyPayslips(user.employeeId!, user.tenantId);
  }

  @Get('payslips/:employeeId')
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  @ApiOperation({ summary: 'Get payslips for a specific employee' })
  getEmployeePayslips(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId') employeeId: string,
  ) {
    return this.payrollService.getMyPayslips(employeeId, user.tenantId);
  }
}
