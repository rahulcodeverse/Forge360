import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

import type { JwtPayload } from '@hrms/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { AssetsService } from './assets.service';

class CreateAssetBody {
  @IsString() name!: string;
  @IsString() assetCode!: string;
  @IsString() type!: string;
  @IsOptional() @IsString() serialNumber?: string;
  @IsOptional() @IsDateString() purchaseDate?: string;
  @IsOptional() @IsNumber() purchaseCost?: number;
}

class AssignAssetBody {
  @IsUUID() employeeId!: string;
  @IsOptional() @IsString() condition?: string;
  @IsOptional() @IsString() notes?: string;
}

@ApiTags('assets')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ path: 'assets', version: '1' })
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  @ApiOperation({ summary: 'List assets with assignment state' })
  listAssets(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return this.assetsService.listAssets(user.tenantId, query);
  }

  @Get('assignments')
  @Roles('hr_admin', 'hr_manager', 'manager', 'super_admin')
  @ApiOperation({ summary: 'List active asset assignments' })
  listAssignments(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return this.assetsService.listAssignments(user.tenantId, query);
  }

  @Post()
  @Roles('hr_admin', 'super_admin')
  @ApiOperation({ summary: 'Create an asset' })
  create(@CurrentUser() user: JwtPayload, @Body() body: CreateAssetBody) {
    return this.assetsService.create(user.tenantId, body);
  }

  @Post(':id/assign')
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  @ApiOperation({ summary: 'Assign an asset to an employee' })
  assign(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: AssignAssetBody) {
    return this.assetsService.assign(user.tenantId, id, body, user.sub);
  }

  @Post('assignments/:id/return')
  @Roles('hr_admin', 'hr_manager', 'super_admin')
  @ApiOperation({ summary: 'Return an assigned asset' })
  returnAsset(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.assetsService.returnAsset(user.tenantId, id, user.sub);
  }
}
