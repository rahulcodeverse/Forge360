import { WorkforceModuleDefinition } from '@forge360/domain';

export class WorkforceRegistryService {
  readonly modules: WorkforceModuleDefinition[] = [
    { key: 'core-hr', name: 'Core HR', lifecycleStage: 'employment' },
    { key: 'organization', name: 'Organization Management', lifecycleStage: 'employment' },
    { key: 'recruitment', name: 'Recruitment ATS', lifecycleStage: 'prehire' },
    { key: 'onboarding', name: 'Onboarding', lifecycleStage: 'joining' },
    { key: 'attendance', name: 'Attendance Management', lifecycleStage: 'employment' },
    { key: 'leave', name: 'Leave Management', lifecycleStage: 'employment' },
    { key: 'shift', name: 'Shift Management', lifecycleStage: 'employment' },
    { key: 'payroll', name: 'Payroll Engine', lifecycleStage: 'employment' },
    { key: 'compliance', name: 'Global Compliance Engine', lifecycleStage: 'employment' },
    { key: 'forms', name: 'Dynamic Form Builder', lifecycleStage: 'platform' },
    { key: 'workflows', name: 'Dynamic Workflow Builder', lifecycleStage: 'platform' },
    { key: 'policies', name: 'Dynamic Policy Builder', lifecycleStage: 'platform' },
    { key: 'expenses', name: 'Expense Management', lifecycleStage: 'employment' },
    { key: 'performance', name: 'Performance Management', lifecycleStage: 'growth' },
    { key: 'learning', name: 'Learning Management', lifecycleStage: 'growth' },
    { key: 'assets', name: 'Asset Management', lifecycleStage: 'employment' },
    { key: 'engagement', name: 'Employee Engagement', lifecycleStage: 'employment' },
    { key: 'helpdesk', name: 'Helpdesk', lifecycleStage: 'employment' },
    { key: 'exit', name: 'Exit Management', lifecycleStage: 'retirement' },
    { key: 'ai', name: 'Forge360 AI', lifecycleStage: 'platform' },
    { key: 'analytics', name: 'Analytics and BI', lifecycleStage: 'platform' },
    { key: 'marketplace', name: 'Integrations Marketplace', lifecycleStage: 'platform' }
  ];
}

