import { Body, Controller, Get, Post } from '@nestjs/common';
import { RuleDefinition, RuleEvaluationInput } from '@forge360/rule-engine';
import { RuleCatalogService } from './rule-catalog.service';

@Controller('rules')
export class RuleCatalogController {
  constructor(private readonly rules: RuleCatalogService) {}

  @Get()
  list(): RuleDefinition[] {
    return this.rules.listRules();
  }

  @Post()
  create(@Body() input: RuleDefinition): RuleDefinition {
    return this.rules.createRule(input);
  }

  @Post('evaluate')
  evaluate(@Body() input: RuleEvaluationInput) {
    return this.rules.evaluate(input);
  }
}
