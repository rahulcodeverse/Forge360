import { Injectable } from '@nestjs/common';
import { AiCapability, AnalyticsMetric } from '@forge360/domain';

@Injectable()
export class PlatformCatalogService {
  capabilities() {
    return [
      'Dynamic employee fields',
      'No-code form builder',
      'No-code workflow builder',
      'Configurable policy builder',
      'Configurable payroll and compliance engines',
      'Integration marketplace',
      'Custom dashboard builder',
      'Multi-language, multi-currency, multi-time-zone localization',
    ];
  }

  securityModel() {
    return {
      authentication: ['email', 'mobile_otp', 'google', 'microsoft', 'linkedin', 'github', 'saml', 'oauth2', 'mfa'],
      authorization: ['rbac', 'abac', 'purpose_based_access', 'tenant_scopes'],
      controls: ['audit_logs', 'ip_restrictions', 'session_management', 'encryption', 'gdpr', 'dpdp', 'soc2_ready', 'iso27001_ready'],
    };
  }

  analytics(): AnalyticsMetric[] {
    return [
      { key: 'headcount', label: 'Headcount', value: 24850, unit: 'count', trend: 'up' },
      { key: 'attrition', label: 'Attrition', value: 8.4, unit: 'percent', trend: 'down' },
      { key: 'payroll_cost', label: 'Payroll Cost', value: 18400000, unit: 'currency', trend: 'flat' },
      { key: 'engagement', label: 'Engagement Score', value: 82, unit: 'score', trend: 'up' },
    ];
  }

  ai(): AiCapability[] {
    return [
      {
        key: 'hr-copilot',
        name: 'HR Copilot',
        description: 'Answers leave, payroll, policy, and lifecycle questions from approved tenant knowledge.',
        dataBoundary: 'employee_permissioned',
      },
      {
        key: 'ai-recruitment',
        name: 'AI Recruitment',
        description: 'Ranks resumes, matches candidates, and drafts job descriptions.',
        dataBoundary: 'tenant',
      },
      {
        key: 'ai-analytics',
        name: 'AI Analytics',
        description: 'Predicts attrition, retention risk, workforce demand, and anomaly patterns.',
        dataBoundary: 'legal_entity',
      },
      {
        key: 'document-intelligence',
        name: 'Document Intelligence',
        description: 'Extracts structured data from resumes, forms, receipts, and contracts.',
        dataBoundary: 'employee_permissioned',
      },
    ];
  }
}
