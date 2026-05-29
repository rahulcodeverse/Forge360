export type RuleStatus = 'draft' | 'active' | 'retired';
export type RuleExpressionOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between';

export interface RuleCondition {
  field: string;
  operator: RuleExpressionOperator;
  value: unknown;
}

export interface RuleFormula {
  expression: string;
  variables: string[];
}

export interface RuleSlab {
  from: number;
  to?: number;
  formula: RuleFormula;
}

export interface RuleDefinition {
  id: string;
  tenantId: string;
  namespace: 'payroll' | 'compliance' | 'leave' | 'attendance' | 'workflow' | 'policy' | 'form';
  code: string;
  name: string;
  version?: number;
  status?: RuleStatus;
  effectiveFrom: string;
  effectiveTo?: string;
  conditions: RuleCondition[];
  formula?: RuleFormula;
  slabs?: RuleSlab[];
  metadata: Record<string, unknown>;
}

export interface RuleEvaluationInput {
  facts: Record<string, unknown>;
  rule: RuleDefinition;
}

export interface RuleEvaluationResult {
  matched: boolean;
  outputs: Record<string, unknown>;
  trace: string[];
}

export class ConfigurableRuleEngine {
  evaluate(input: RuleEvaluationInput): RuleEvaluationResult {
    const trace: string[] = [];
    const matched = input.rule.conditions.every((condition) => {
      const actual = input.facts[condition.field];
      const result = compare(actual, condition.operator, condition.value);
      trace.push(`${condition.field} ${condition.operator} ${String(condition.value)} => ${result}`);
      return result;
    });

    return {
      matched,
      outputs: matched ? { formula: input.rule.formula, slabs: input.rule.slabs ?? [] } : {},
      trace,
    };
  }
}

function compare(actual: unknown, operator: RuleExpressionOperator, expected: unknown): boolean {
  switch (operator) {
    case 'eq':
      return actual === expected;
    case 'neq':
      return actual !== expected;
    case 'gt':
      return Number(actual) > Number(expected);
    case 'gte':
      return Number(actual) >= Number(expected);
    case 'lt':
      return Number(actual) < Number(expected);
    case 'lte':
      return Number(actual) <= Number(expected);
    case 'in':
      return Array.isArray(expected) && expected.includes(actual);
    case 'between':
      return Array.isArray(expected) && Number(actual) >= Number(expected[0]) && Number(actual) <= Number(expected[1]);
    default:
      return false;
  }
}

