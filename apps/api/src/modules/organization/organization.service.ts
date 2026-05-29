import { Injectable } from '@nestjs/common';
import { OrganizationUnit } from '@forge360/domain';

const timestamp = '2026-05-29T00:00:00.000Z';

@Injectable()
export class OrganizationService {
  private readonly data: OrganizationUnit[] = [
    {
      id: 'le_global',
      tenantId: 'demo',
      type: 'company',
      name: 'Forge360 Global',
      code: 'F360-GLOBAL',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'dept_people',
      tenantId: 'demo',
      type: 'department',
      name: 'People Operations',
      code: 'PEOPLE',
      parentId: 'le_global',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'dept_engineering',
      tenantId: 'demo',
      type: 'department',
      name: 'Platform Engineering',
      code: 'ENG',
      parentId: 'le_global',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];

  units(): OrganizationUnit[] {
    return this.data;
  }

  orgChart() {
    return {
      root: this.data[0],
      children: this.data.filter((unit) => unit.parentId === 'le_global'),
    };
  }
}
