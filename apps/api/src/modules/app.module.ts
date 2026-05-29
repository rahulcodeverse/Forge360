import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { EmployeesController } from './employees.controller.js';
import { LeaveController } from './leave.controller.js';
import { PayrollController } from './payroll.controller.js';

@Module({
  controllers: [HealthController, EmployeesController, LeaveController, PayrollController],
})
export class AppModule {}

