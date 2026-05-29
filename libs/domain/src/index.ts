export type WorkforceLifecycleStage =
  | 'prehire'
  | 'joining'
  | 'employment'
  | 'growth'
  | 'retirement'
  | 'platform';

export interface WorkforceModuleDefinition {
  key: string;
  name: string;
  lifecycleStage: WorkforceLifecycleStage;
}

export interface TenantScopedEntity {
  id: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EffectiveDatedRecord {
  effectiveFrom: string;
  effectiveTo?: string;
}

export type EmploymentStatus = 'prehire' | 'active' | 'on_leave' | 'exited';

export interface Employee extends TenantScopedEntity {
  employeeNumber: string;
  displayName: string;
  email: string;
  status: EmploymentStatus;
  legalEntityId: string;
  departmentId: string;
  designation: string;
  managerId?: string;
  locationProfileId: string;
  customFields: Record<string, unknown>;
}

export interface OrganizationUnit extends TenantScopedEntity {
  type: 'company' | 'subsidiary' | 'department' | 'team' | 'business_unit' | 'cost_center';
  name: string;
  parentId?: string;
  code: string;
}

export interface WorkflowDefinition extends TenantScopedEntity, EffectiveDatedRecord {
  name: string;
  category: 'leave' | 'payroll' | 'recruitment' | 'expense' | 'asset' | 'onboarding' | 'offboarding';
  version: number;
  status: 'draft' | 'active' | 'retired';
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  type: 'start' | 'approval' | 'condition' | 'task' | 'sla' | 'end';
  label: string;
  config: Record<string, unknown>;
}

export interface DynamicFormDefinition extends TenantScopedEntity, EffectiveDatedRecord {
  name: string;
  category: 'joining' | 'tax' | 'hr' | 'exit' | 'survey' | 'feedback';
  version: number;
  fields: DynamicFormField[];
}

export interface DynamicFormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'file' | 'signature' | 'textarea' | 'currency';
  required: boolean;
  options?: string[];
  visibleWhen?: Record<string, unknown>;
}

export interface PayrollComponent extends TenantScopedEntity, EffectiveDatedRecord {
  code: string;
  name: string;
  type: 'earning' | 'deduction' | 'tax' | 'benefit' | 'contribution';
  calculationMode: 'formula' | 'fixed' | 'percentage' | 'slab';
  ruleId: string;
}

export interface AnalyticsMetric {
  key: string;
  label: string;
  value: number;
  unit: 'count' | 'percent' | 'currency' | 'score';
  trend: 'up' | 'down' | 'flat';
}

export interface AiCapability {
  key: string;
  name: string;
  description: string;
  dataBoundary: 'tenant' | 'legal_entity' | 'employee_permissioned';
}
