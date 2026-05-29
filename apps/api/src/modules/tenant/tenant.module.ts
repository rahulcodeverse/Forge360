import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';

@Module({
  imports: [BullModule.registerQueue({ name: 'tenant-provisioning' })],
  providers: [TenantService],
  controllers: [TenantController],
  exports: [TenantService],
})
export class TenantModule {}
