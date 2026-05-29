import { Module } from '@nestjs/common';
import { RuleCatalogService } from './rule-catalog.service';
import { RuleCatalogController } from './rule-catalog.controller';

@Module({
  controllers: [RuleCatalogController],
  providers: [RuleCatalogService],
  exports: [RuleCatalogService],
})
export class RuleEngineModule {}
