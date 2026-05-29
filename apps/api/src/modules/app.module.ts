import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { TenantModule } from './tenant/tenant.module';
import { WorkforceModule } from './workforce/workforce.module';
import { RuleEngineModule } from './rules/rule-engine.module';
import { EmployeesModule } from './employees/employees.module';
import { OrganizationModule } from './organization/organization.module';
import { PlatformModule } from './platform/platform.module';

@Module({
  imports: [TenantModule, WorkforceModule, RuleEngineModule, EmployeesModule, OrganizationModule, PlatformModule],
  controllers: [HealthController],
})
export class AppModule {}
