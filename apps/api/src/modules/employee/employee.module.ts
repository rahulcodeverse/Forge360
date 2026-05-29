import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [BullModule.registerQueue({ name: 'bulk-import' }), AuditModule],
  providers: [EmployeeService],
  controllers: [EmployeeController],
  exports: [EmployeeService],
})
export class EmployeeModule {}
