import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceGateway } from './attendance.gateway';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [BullModule.registerQueue({ name: 'attendance-jobs' }), AuditModule],
  providers: [AttendanceService, AttendanceGateway],
  controllers: [AttendanceController],
  exports: [AttendanceService],
})
export class AttendanceModule {}
