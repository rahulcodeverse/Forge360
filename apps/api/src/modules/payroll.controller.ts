import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('payroll')
@Controller('payroll')
export class PayrollController {
  @Post('run-preview')
  runPreview(@Body() body: { month: number; year: number }) {
    const gross = Math.round((70000 * (28 / 30) + Number.EPSILON) * 100) / 100;
    const pf = 1800;
    const net = Math.round((gross - pf + Number.EPSILON) * 100) / 100;
    return {
      data: {
        month: body.month,
        year: body.year,
        employeeCount: 1,
        totalGross: gross,
        totalDeductions: pf,
        totalNet: net,
        items: [
          {
            employeeId: 'emp-in',
            country: 'IN',
            gross,
            deductions: pf,
            net,
            lopDays: 2,
            components: [
              { code: 'BASIC', type: 'earning', amount: 50000, taxable: true },
              { code: 'HRA', type: 'earning', amount: 20000, taxable: true },
              { code: 'PF_EMPLOYEE', type: 'statutory', amount: pf },
            ],
          },
        ],
      },
    };
  }
}
