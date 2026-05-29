import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Request } from 'express';

import type { JwtPayload } from '@hrms/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AttendanceService } from './attendance.service';

class ClockInBody {
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
}

class RegularizeBody {
  @IsDateString() date!: string;
  @IsOptional() @IsString() requestedClockIn?: string;
  @IsOptional() @IsString() requestedClockOut?: string;
  @IsString() reason!: string;
  @IsOptional() @IsString() attachmentUrl?: string;
}

class ApproveRegularizationBody {
  @IsIn(['approved', 'rejected']) decision!: 'approved' | 'rejected';
  @IsOptional() @IsString() comment?: string;
}

class AssignShiftBody {
  @IsUUID() shiftId!: string;
  @IsDateString() effectiveFrom!: string;
  @IsOptional() @IsDateString() effectiveTo?: string;
}

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ path: 'attendance', version: '1' })
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  @ApiOperation({ summary: 'Clock in for today' })
  clockIn(@CurrentUser() user: JwtPayload, @Req() req: Request, @Body() body: ClockInBody) {
    return this.attendanceService.clockIn(user.employeeId!, user.tenantId, {
      source: 'web',
      ip: req.ip,
      latitude: body.latitude,
      longitude: body.longitude,
      note: body.note,
    });
  }

  @Post('clock-out')
  @ApiOperation({ summary: 'Clock out for today' })
  clockOut(@CurrentUser() user: JwtPayload, @Body() body: { note?: string }) {
    return this.attendanceService.clockOut(user.employeeId!, user.tenantId, body);
  }

  @Get('my/monthly')
  @ApiOperation({ summary: 'Get my monthly attendance sheet' })
  getMyMonthly(
    @CurrentUser() user: JwtPayload,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.attendanceService.getMonthlySheet(user.employeeId!, user.tenantId, year, month);
  }

  @Get('employees/:employeeId/monthly')
  @Roles('hr_admin', 'hr_manager', 'manager', 'super_admin')
  @ApiOperation({ summary: 'Get monthly attendance sheet for a specific employee' })
  getEmployeeMonthly(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId') employeeId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.attendanceService.getMonthlySheet(employeeId, user.tenantId, year, month);
  }

  @Get('live-summary')
  @Roles('hr_admin', 'hr_manager', 'manager', 'super_admin')
  @ApiOperation({ summary: 'Get live attendance summary for today' })
  getLiveSummary(@CurrentUser() user: JwtPayload) {
    return this.attendanceService.getLiveSummary(user.tenantId);
  }

  @Post('regularize')
  @ApiOperation({ summary: 'Submit a regularization request' })
  regularize(@CurrentUser() user: JwtPayload, @Body() body: RegularizeBody) {
    return this.attendanceService.submitRegularization(user.employeeId!, user.tenantId, {
      date: body.date,
      requestedClockIn: body.requestedClockIn ? new Date(body.requestedClockIn) : undefined,
      requestedClockOut: body.requestedClockOut ? new Date(body.requestedClockOut) : undefined,
      reason: body.reason,
      attachmentUrl: body.attachmentUrl,
    });
  }

  @Post('regularize/:requestId/decision')
  @Roles('hr_admin', 'hr_manager', 'manager', 'super_admin')
  @ApiOperation({ summary: 'Approve or reject a regularization request' })
  approveRegularization(
    @CurrentUser() user: JwtPayload,
    @Param('requestId') requestId: string,
    @Body() body: ApproveRegularizationBody,
  ) {
    return this.attendanceService.approveRegularization(
      requestId,
      user.tenantId,
      user.sub,
      body.decision,
      body.comment,
    );
  }

  @Get('shifts')
  @ApiOperation({ summary: 'List all shifts' })
  getShifts(@CurrentUser() user: JwtPayload) {
    return this.attendanceService.getShifts(user.tenantId);
  }

  @Post('employees/:employeeId/shift')
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  @ApiOperation({ summary: 'Assign a shift to an employee' })
  assignShift(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId') employeeId: string,
    @Body() body: AssignShiftBody,
  ) {
    return this.attendanceService.assignShift(
      employeeId,
      user.tenantId,
      body.shiftId,
      body.effectiveFrom,
      body.effectiveTo,
    );
  }
}
