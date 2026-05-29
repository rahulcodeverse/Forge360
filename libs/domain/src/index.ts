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

