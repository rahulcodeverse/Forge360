import { RuleDefinition } from '@forge360/rule-engine';
import { ConfigurableRuleEngine, RuleEvaluationInput } from '@forge360/rule-engine';

export class RuleCatalogService {
  private readonly engine = new ConfigurableRuleEngine();
  private readonly rules: RuleDefinition[] = [
    {
      id: 'rule_global_contribution_demo',
      tenantId: 'demo',
      namespace: 'payroll',
      code: 'GLOBAL_CONTRIBUTION',
      name: 'Global Contribution Demo',
      version: 1,
      status: 'active',
      effectiveFrom: '2026-01-01',
      conditions: [{ field: 'employmentType', operator: 'in', value: ['full_time', 'part_time'] }],
      formula: { expression: 'grossPay * configuredRate', variables: ['grossPay', 'configuredRate'] },
      metadata: {
        configuredBy: 'tenant-admin',
        countrySpecific: false,
        description: 'Example payroll contribution represented as configurable tenant data.',
      },
    },
  ];

  createRule(definition: RuleDefinition): RuleDefinition {
    const rule = {
      ...definition,
      status: definition.status ?? 'draft',
      version: definition.version ?? 1,
    };
    this.rules.push(rule);
    return rule;
  }

  listRules(): RuleDefinition[] {
    return this.rules;
  }

  evaluate(input: RuleEvaluationInput) {
    return this.engine.evaluate(input);
  }
}
