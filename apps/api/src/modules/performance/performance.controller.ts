import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

import type { JwtPayload } from '@hrms/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PerformanceService } from './performance.service';

class CreateGoalBody {
  @IsUUID() cycleId!: string;
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @Type(() => Number) @IsNumber() @Min(0) @Max(100) weight!: number;
  @IsOptional() @Type(() => Number) @IsNumber() targetValue?: number;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsUUID() parentGoalId?: string;
}

class CheckInBody {
  @IsOptional() @Type(() => Number) @IsNumber() actualValue?: number;
  @IsOptional() @IsString() progressNote?: string;
}

class SubmitReviewBody {
  @IsUUID() cycleId!: string;
  @IsUUID() revieweeId!: string;
  @IsString() reviewerType!: string;
  @IsArray() responses!: Array<{ questionId: string; rating?: number; text?: string }>;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(5) overallRating?: number;
  @IsOptional() @IsString() summaryComment?: string;
}

class CalibrateBody {
  @Type(() => Number) @IsNumber() @Min(1) @Max(5) newRating!: number;
  @IsString() justification!: string;
}

@ApiTags('performance')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ path: 'performance', version: '1' })
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('cycles')
  @ApiOperation({ summary: 'Get active goal cycles' })
  getCycles(@CurrentUser() user: JwtPayload) {
    return this.performanceService.getActiveCycles(user.tenantId);
  }

  @Get('goals')
  @ApiOperation({ summary: 'Get my goals' })
  getMyGoals(
    @CurrentUser() user: JwtPayload,
    @Query('cycleId') cycleId?: string,
  ) {
    return this.performanceService.getGoals(user.employeeId!, user.tenantId, cycleId);
  }

  @Get('goals/:employeeId')
  @Roles('hr_admin', 'hr_manager', 'manager', 'super_admin')
  getEmployeeGoals(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId') employeeId: string,
    @Query('cycleId') cycleId?: string,
  ) {
    return this.performanceService.getGoals(employeeId, user.tenantId, cycleId);
  }

  @Post('goals')
  @ApiOperation({ summary: 'Create a new goal' })
  createGoal(@CurrentUser() user: JwtPayload, @Body() body: CreateGoalBody) {
    return this.performanceService.createGoal(user.employeeId!, user.tenantId, body);
  }

  @Post('goals/:goalId/check-in')
  @ApiOperation({ summary: 'Add a progress check-in to a goal' })
  checkIn(
    @CurrentUser() user: JwtPayload,
    @Param('goalId') goalId: string,
    @Body() body: CheckInBody,
  ) {
    return this.performanceService.addCheckIn(goalId, user.employeeId!, user.tenantId, body);
  }

  @Get('review-cycles')
  @ApiOperation({ summary: 'Get all review cycles' })
  getReviewCycles(@CurrentUser() user: JwtPayload) {
    return this.performanceService.getReviewCycles(user.tenantId);
  }

  @Post('reviews')
  @ApiOperation({ summary: 'Submit a review' })
  submitReview(@CurrentUser() user: JwtPayload, @Body() body: SubmitReviewBody) {
    return this.performanceService.submitReview(user.employeeId!, user.tenantId, body);
  }

  @Get('calibration/:cycleId')
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  @ApiOperation({ summary: 'Get calibration data — bell curve of manager ratings' })
  getCalibration(@CurrentUser() user: JwtPayload, @Param('cycleId') cycleId: string) {
    return this.performanceService.getCalibrationData(cycleId, user.tenantId);
  }

  @Put('calibration/:submissionId/override')
  @Roles('hr_admin', 'super_admin')
  @ApiOperation({ summary: 'Override a manager rating during calibration' })
  overrideRating(
    @CurrentUser() user: JwtPayload,
    @Param('submissionId') submissionId: string,
    @Body() body: CalibrateBody,
  ) {
    return this.performanceService.overrideRating(
      submissionId,
      user.tenantId,
      user.sub,
      body.newRating,
      body.justification,
    );
  }
}
