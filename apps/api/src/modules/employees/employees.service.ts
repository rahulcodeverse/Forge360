import { Injectable, NotFoundException } from '@nestjs/common';
import { Employee } from '@forge360/domain';

const now = () => new Date().toISOString();

@Injectable()
export class EmployeesService {
  private readonly employees: Employee[] = [
    {
      id: 'emp_1001',
      tenantId: 'demo',
      employeeNumber: 'F360-1001',
      displayName: 'Aarav Mehta',
      email: 'aarav.mehta@forge360.example',
      status: 'active',
      legalEntityId: 'le_global',
      departmentId: 'dept_people',
      designation: 'People Operations Lead',
      managerId: 'emp_1003',
      locationProfileId: 'loc_global_remote',
      customFields: { workMode: 'hybrid', skills: ['HR Ops', 'Analytics'] },
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'emp_1002',
      tenantId: 'demo',
      employeeNumber: 'F360-1002',
      displayName: 'Maya Chen',
      email: 'maya.chen@forge360.example',
      status: 'active',
      legalEntityId: 'le_global',
      departmentId: 'dept_engineering',
      designation: 'Principal Engineer',
      managerId: 'emp_1003',
      locationProfileId: 'loc_global_remote',
      customFields: { workMode: 'remote', skills: ['Platform', 'Security'] },
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  list(): Employee[] {
    return this.employees;
  }

  get(id: string): Employee {
    const employee = this.employees.find((item) => item.id === id);
    if (!employee) {
      throw new NotFoundException(`Employee ${id} was not found`);
    }

    return employee;
  }

  create(input: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Employee {
    const employee: Employee = {
      ...input,
      id: `emp_${this.employees.length + 1001}`,
      createdAt: now(),
      updatedAt: now(),
    };
    this.employees.push(employee);
    return employee;
  }
}
