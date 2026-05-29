import { Controller, Get } from '@nestjs/common';
import { OrganizationService } from './organization.service';

@Controller('organization')
export class OrganizationController {
  constructor(private readonly organization: OrganizationService) {}

  @Get('units')
  units() {
    return this.organization.units();
  }

  @Get('org-chart')
  orgChart() {
    return this.organization.orgChart();
  }
}
