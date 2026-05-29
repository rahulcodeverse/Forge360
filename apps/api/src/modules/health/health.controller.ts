import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'forge360-api',
      timestamp: new Date().toISOString(),
    };
  }
}

