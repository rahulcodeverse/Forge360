import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { TenantModule } from './tenant/tenant.module';
import { WorkforceModule } from './workforce/workforce.module';
import { RuleEngineModule } from './rules/rule-engine.module';

@Module({
  imports: [TenantModule, WorkforceModule, RuleEngineModule],
  controllers: [HealthController],
})
export class AppModule {}

