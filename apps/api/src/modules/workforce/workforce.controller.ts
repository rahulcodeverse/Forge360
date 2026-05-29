import { Controller, Get } from '@nestjs/common';
import { WorkforceRegistryService } from './workforce-registry.service';

@Controller('workforce')
export class WorkforceController {
  constructor(private readonly registry: WorkforceRegistryService) {}

  @Get('modules')
  modules() {
    return this.registry.modules;
  }

  @Get('suite')
  suite() {
    return this.registry.getSuiteOverview();
  }
}
