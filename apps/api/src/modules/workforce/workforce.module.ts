import { Module } from '@nestjs/common';
import { WorkforceRegistryService } from './workforce-registry.service';
import { WorkforceController } from './workforce.controller';

@Module({
  controllers: [WorkforceController],
  providers: [WorkforceRegistryService],
  exports: [WorkforceRegistryService],
})
export class WorkforceModule {}
