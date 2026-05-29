import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [BullModule.registerQueue({ name: 'report-generation' })],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
