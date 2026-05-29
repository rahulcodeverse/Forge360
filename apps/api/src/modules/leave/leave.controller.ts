import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

import type { JwtPayload } from '@hrms/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { LeaveService } from './leave.service';

class CreateLeaveBody {
  @IsUUID() leaveTypeId!: string;
  @IsDateString() fromDate!: string;
  @IsDateString() toDate!: string;
  @IsOptional() @IsBoolean() isHalfDay?: boolean;
  @IsOptional() @IsIn(['first_half', 'second_half']) halfDayType?: string;
  @IsString() reason!: string;
  @IsOptional() @IsString() attachmentUrl?: string;
}

class DecisionBody {
  @IsIn(['approved', 'rejected']) decision!: 'approved' | 'rejected';
  @IsOptional() @IsString() comment?: string;
}

@ApiTags('leave')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ path: 'leave', version: '1' })
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get('types')
  @ApiOperation({ summary: 'Get all leave types for this tenant' })
  getTypes(@CurrentUser() user: JwtPayload) {
    return this.leaveService.getLeaveTypes(user.tenantId);
  }

  @Get('balance')
  @ApiOperation({ summary: "Get current employee's leave balances" })
  getMyBalance(
    @CurrentUser() user: JwtPayload,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.leaveService.getBalances(user.employeeId!, user.tenantId, year);
  }

  @Get('balance/:employeeId')
  @Roles('hr_admin', 'hr_manager', 'manager', 'super_admin')
  getEmployeeBalance(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId') employeeId: string,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.leaveService.getBalances(employeeId, user.tenantId, year);
  }

  @Get('requests')
  @ApiOperation({ summary: 'Get leave requests (employee sees own, managers see team)' })
  getRequests(
    @CurrentUser() user: JwtPayload,
    @Query() dto: PaginationDto,
    @Query('status') status?: string,
    @Query('year') year?: string,
  ) {
    const isEmployee = user.role === 'employee';
    return this.leaveService.findRequests(
      user.tenantId,
      {
        employeeId: isEmployee ? user.employeeId : undefined,
        status,
        year: year ? parseInt(year) : undefined,
      },
      dto,
    );
  }

  @Post('requests')
  @ApiOperation({ summary: 'Apply for leave' })
  createRequest(@CurrentUser() user: JwtPayload, @Body() body: CreateLeaveBody) {
    return this.leaveService.create(user.employeeId!, user.tenantId, body);
  }

  @Post('requests/:id/decision')
  @Roles('hr_admin', 'hr_manager', 'manager', 'super_admin')
  @ApiOperation({ summary: 'Approve or reject a leave request' })
  decide(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: DecisionBody,
  ) {
    return this.leaveService.approve(id, user.tenantId, user.sub, body.decision, body.comment);
  }

  @Delete('requests/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a leave request' })
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.leaveService.cancel(id, user.tenantId, user.employeeId!);
  }
}
