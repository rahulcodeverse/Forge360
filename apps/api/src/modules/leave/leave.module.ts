import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { LeaveService } from './leave.service';
import { LeavePolicyService } from './leave-policy.service';
import { LeaveBalanceService } from './leave-balance.service';
import { LeaveController } from './leave.controller';
import { WorkflowModule } from '../workflow/workflow.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [BullModule.registerQueue({ name: 'leave-sla' }), WorkflowModule, AuditModule],
  providers: [LeaveService, LeavePolicyService, LeaveBalanceService],
  controllers: [LeaveController],
  exports: [LeaveService, LeaveBalanceService],
})
export class LeaveModule {}
