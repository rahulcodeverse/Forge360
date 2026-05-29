import { RuleDefinition } from '@forge360/rule-engine';

export class RuleCatalogService {
  createRule(definition: RuleDefinition): RuleDefinition {
    return {
      ...definition,
      status: definition.status ?? 'draft',
      version: definition.version ?? 1,
    };
  }
}

