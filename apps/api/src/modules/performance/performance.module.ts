import { Module } from '@nestjs/common';

import { PerformanceService } from './performance.service';
import { PerformanceController } from './performance.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [PerformanceService],
  controllers: [PerformanceController],
  exports: [PerformanceService],
})
export class PerformanceModule {}
