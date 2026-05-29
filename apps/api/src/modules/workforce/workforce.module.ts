import { Module } from '@nestjs/common';
import { WorkforceRegistryService } from './workforce-registry.service';

@Module({
  providers: [WorkforceRegistryService],
  exports: [WorkforceRegistryService],
})
export class WorkforceModule {}

