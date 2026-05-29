import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantService } from './tenant.service';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller({ path: 'tenants', version: '1' })
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get(':id')
  @Roles('super_admin')
  findOne(@Param('id') id: string) {
    return this.tenantService.findById(id);
  }
}
