import { Controller, Get } from '@nestjs/common';
import { PlatformCatalogService } from './platform-catalog.service';

@Controller('platform')
export class PlatformController {
  constructor(private readonly catalog: PlatformCatalogService) {}

  @Get('capabilities')
  capabilities() {
    return this.catalog.capabilities();
  }

  @Get('security')
  security() {
    return this.catalog.securityModel();
  }

  @Get('analytics')
  analytics() {
    return this.catalog.analytics();
  }

  @Get('ai')
  ai() {
    return this.catalog.ai();
  }
}
