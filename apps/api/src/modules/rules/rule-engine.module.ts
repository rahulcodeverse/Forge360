import { Module } from '@nestjs/common';
import { RuleCatalogService } from './rule-catalog.service';

@Module({
  providers: [RuleCatalogService],
  exports: [RuleCatalogService],
})
export class RuleEngineModule {}

