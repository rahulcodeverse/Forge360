import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { RecruitmentService } from './recruitment.service';
import { RecruitmentController } from './recruitment.controller';
import { AuditModule } from '../audit/audit.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [BullModule.registerQueue({ name: 'recruitment-notifications' }), AuditModule, StorageModule],
  providers: [RecruitmentService],
  controllers: [RecruitmentController],
  exports: [RecruitmentService],
})
export class RecruitmentModule {}
