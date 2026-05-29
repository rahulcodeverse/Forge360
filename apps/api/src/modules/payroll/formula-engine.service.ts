import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { create, all } from 'mathjs';

const math = create(all);

// Restrict to pure math functions — no eval, no network, no file I/O
math.import(
  {
    import: () => { throw new Error('import not allowed'); },
    createUnit: () => { throw new Error('createUnit not allowed'); },
  },
  { override: true },
);

@Injectable()
export class FormulaEngineService {
  private readonly logger = new Logger(FormulaEngineService.name);

  /**
   * Evaluates a payroll component formula against a scope of resolved values.
   *
   * Formulas reference component codes: `HRA = BASIC * 0.4`
   * The scope contains already-computed component values.
   */
  evaluate(expression: string, scope: Record<string, number>): number {
    try {
      const result = math.evaluate(expression, { ...scope });
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new BadRequestException(`Formula "${expression}" did not return a finite number`);
      }
      return Math.max(0, parseFloat(result.toFixed(2)));
    } catch (err) {
      this.logger.error(`Formula evaluation error: ${expression}`, err);
      throw new BadRequestException(
        `Invalid formula "${expression}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Validates a formula expression without executing it against real data.
   * Uses dummy values of 1 for each variable to detect syntax errors.
   */
  validate(expression: string, variableNames: string[]): boolean {
    const dummyScope = Object.fromEntries(variableNames.map((v) => [v, 1]));
    try {
      this.evaluate(expression, dummyScope);
      return true;
    } catch {
      return false;
    }
  }
}
