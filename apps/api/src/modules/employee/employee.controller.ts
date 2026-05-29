import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

import type { JwtPayload } from '@hrms/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { EmployeeService } from './employee.service';

class CreateEmployeeBody {
  @IsString() firstName!: string;
  @IsOptional() @IsString() middleName?: string;
  @IsString() lastName!: string;
  @IsEmail() workEmail!: string;
  @IsOptional() @IsString() phone?: string;
  @IsDateString() joiningDate!: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsDateString() probationEndDate?: string;
  @IsOptional() @IsString() employmentType?: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsUUID() designationId?: string;
  @IsOptional() @IsUUID() gradeId?: string;
  @IsOptional() @IsUUID() locationId?: string;
  @IsOptional() @IsUUID() costCenterId?: string;
  @IsOptional() @IsUUID() reportingManagerId?: string;
  @IsOptional() @IsString() personalEmail?: string;
}

@ApiTags('employees')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard, TenantGuard)
@Controller({ path: 'employees', version: '1' })
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  @Roles('hr_admin', 'hr_manager', 'manager', 'super_admin')
  @ApiOperation({ summary: 'List all employees with pagination, search, and sorting' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return this.employeeService.findAll(user.tenantId, query);
  }

  @Get('org-chart')
  @ApiOperation({ summary: 'Get full org chart tree' })
  getOrgChart(@CurrentUser() user: JwtPayload) {
    return this.employeeService.getOrgChart(user.tenantId);
  }

  @Get('departments')
  @ApiOperation({ summary: 'List all departments with employee counts' })
  getDepartments(@CurrentUser() user: JwtPayload) {
    return this.employeeService.getDepartments(user.tenantId);
  }

  @Get('designations')
  @ApiOperation({ summary: 'List all designations' })
  getDesignations(@CurrentUser() user: JwtPayload) {
    return this.employeeService.getDesignations(user.tenantId);
  }

  @Get('grades')
  @ApiOperation({ summary: 'List all grades' })
  getGrades(@CurrentUser() user: JwtPayload) {
    return this.employeeService.getGrades(user.tenantId);
  }

  @Get('locations')
  @ApiOperation({ summary: 'List all locations' })
  getLocations(@CurrentUser() user: JwtPayload) {
    return this.employeeService.getLocations(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID with full profile' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.employeeService.findById(id, user.tenantId);
  }

  @Post()
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  @ApiOperation({ summary: 'Create a new employee and their user account' })
  create(@CurrentUser() user: JwtPayload, @Body() body: CreateEmployeeBody) {
    return this.employeeService.create(
      user.tenantId,
      { ...body, employmentType: body.employmentType ?? 'full_time' },
      user.sub,
    );
  }

  @Patch(':id')
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  @ApiOperation({ summary: 'Update employee details' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Partial<CreateEmployeeBody>,
  ) {
    return this.employeeService.update(id, user.tenantId, body, user.sub);
  }

  @Delete(':id')
  @Roles('hr_admin', 'super_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete employee (sets deletedAt, status=terminated)' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.employeeService.softDelete(id, user.tenantId, user.sub);
  }

  @Post('bulk-import/validate')
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  @ApiOperation({ summary: 'Validate a CSV bulk import — dry run' })
  validateImport(
    @CurrentUser() user: JwtPayload,
    @Body() body: { rows: Array<Record<string, unknown>> },
  ) {
    return this.employeeService.validateBulkImport(user.tenantId, body.rows);
  }

  @Post('bulk-import/queue')
  @Roles('hr_admin', 'super_admin')
  @ApiOperation({ summary: 'Queue a bulk import from an uploaded file key' })
  async queueImport(
    @CurrentUser() user: JwtPayload,
    @Body() body: { fileKey: string },
  ) {
    const jobId = await this.employeeService.queueBulkImport(
      user.tenantId,
      body.fileKey,
      user.sub,
    );
    return { jobId };
  }
}
