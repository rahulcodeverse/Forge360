import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

import type { JwtPayload } from '@hrms/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { LearningService } from './learning.service';

class ProgressBody {
  @Type(() => Number) @IsInt() @Min(0) @Max(100) progressPercent!: number;
}

@ApiTags('learning')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'learning', version: '1' })
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Get('courses')
  getCourses(
    @CurrentUser() user: JwtPayload,
    @Query() dto: PaginationDto,
    @Query('type') type?: string,
  ) {
    return this.learningService.getCourses(user.tenantId, dto, type);
  }

  @Post('courses/:courseId/enroll')
  enroll(@CurrentUser() user: JwtPayload, @Param('courseId') courseId: string) {
    return this.learningService.enroll(user.employeeId!, user.tenantId, courseId);
  }

  @Put('courses/:courseId/progress')
  updateProgress(
    @CurrentUser() user: JwtPayload,
    @Param('courseId') courseId: string,
    @Body() body: ProgressBody,
  ) {
    return this.learningService.updateProgress(
      user.employeeId!,
      user.tenantId,
      courseId,
      body.progressPercent,
    );
  }

  @Get('my-enrollments')
  getMyEnrollments(@CurrentUser() user: JwtPayload) {
    return this.learningService.getEnrollments(user.employeeId!, user.tenantId);
  }
}
