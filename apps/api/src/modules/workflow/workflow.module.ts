import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { WorkflowService } from './workflow.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'workflow-sla' })],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
