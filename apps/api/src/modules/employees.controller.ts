import { Controller, Get, Headers } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';

@ApiTags('employees')
@ApiHeader({ name: 'X-Tenant-ID', required: true })
@Controller('employees')
export class EmployeesController {
  @Get()
  list(@Headers('x-tenant-id') tenantId: string): { data: Array<{ id: string; employeeCode: string; name: string }>; meta: { tenantId: string } } {
    return {
      data: [
        { id: 'emp-1', employeeCode: 'ACME-0001', name: 'Employee1 Demo' },
        { id: 'emp-2', employeeCode: 'ACME-0002', name: 'Employee2 Demo' },
      ],
      meta: { tenantId },
    };
  }
}

