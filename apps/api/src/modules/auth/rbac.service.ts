import { Injectable } from '@nestjs/common';

import type { Role } from '@hrms/shared-types';

// Permission matrix: maps (role, module, action) → allowed
const PERMISSION_MATRIX: Record<Role, Record<string, string[]>> = {
  super_admin: {
    '*': ['read', 'create', 'update', 'delete', 'approve', 'export'],
  },
  hr_admin: {
    employees: ['read', 'create', 'update', 'delete', 'export'],
    attendance: ['read', 'create', 'update', 'approve', 'export'],
    leave: ['read', 'create', 'update', 'approve', 'export'],
    payroll: ['read', 'create', 'update', 'approve', 'export'],
    performance: ['read', 'create', 'update', 'approve', 'export'],
    recruitment: ['read', 'create', 'update', 'approve', 'export'],
    learning: ['read', 'create', 'update', 'delete', 'export'],
    reports: ['read', 'export'],
    settings: ['read', 'create', 'update'],
  },
  hr_manager: {
    employees: ['read', 'create', 'update', 'export'],
    attendance: ['read', 'update', 'approve', 'export'],
    leave: ['read', 'update', 'approve', 'export'],
    payroll: ['read', 'export'],
    performance: ['read', 'create', 'update', 'approve'],
    recruitment: ['read', 'create', 'update'],
    learning: ['read', 'create', 'update'],
    reports: ['read', 'export'],
  },
  manager: {
    employees: ['read'],
    attendance: ['read', 'approve'],
    leave: ['read', 'approve'],
    performance: ['read', 'create', 'update'],
    reports: ['read'],
  },
  employee: {
    employees: ['read'],
    attendance: ['read', 'create'],
    leave: ['read', 'create'],
    payroll: ['read'],
    performance: ['read', 'create'],
    learning: ['read', 'create'],
  },
};

@Injectable()
export class RbacService {
  hasPermission(role: Role, module: string, action: string): boolean {
    const perms = PERMISSION_MATRIX[role];
    if (!perms) return false;

    // Super admin wildcard
    if (perms['*']?.includes(action)) return true;

    const modulePerms = perms[module];
    return modulePerms?.includes(action) ?? false;
  }

  getPermissions(role: Role): Record<string, string[]> {
    return PERMISSION_MATRIX[role] ?? {};
  }
}
