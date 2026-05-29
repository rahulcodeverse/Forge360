import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Employee } from '@forge360/domain';
import { EmployeesService } from './employees.service';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  list(): Employee[] {
    return this.employees.list();
  }

  @Get(':id')
  get(@Param('id') id: string): Employee {
    return this.employees.get(id);
  }

  @Post()
  create(@Body() input: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Employee {
    return this.employees.create(input);
  }
}
