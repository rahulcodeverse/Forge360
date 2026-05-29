import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { PayrollService } from './payroll.service';
import { FormulaEngineService } from './formula-engine.service';
import { PayrollController } from './payroll.controller';
import { IndiaPayrollPlugin } from './plugins/india.plugin';
import { UsPayrollPlugin } from './plugins/us.plugin';
import { UkPayrollPlugin } from './plugins/uk.plugin';
import { UaePayrollPlugin } from './plugins/uae.plugin';
import { AuditModule } from '../audit/audit.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'payroll-run' }),
    BullModule.registerQueue({ name: 'payslip-generation' }),
    AuditModule,
    StorageModule,
  ],
  providers: [
    PayrollService,
    FormulaEngineService,
    IndiaPayrollPlugin,
    UsPayrollPlugin,
    UkPayrollPlugin,
    UaePayrollPlugin,
  ],
  controllers: [PayrollController],
  exports: [PayrollService],
})
export class PayrollModule {}
