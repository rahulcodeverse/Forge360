# ADR 0002 — Payroll Engine: Plugin Architecture with mathjs Formula Evaluator

**Status**: Accepted  
**Date**: 2026-05-29

## Context

Payroll is the most country-specific module. India uses PF/ESI/TDS, US uses FICA/FUTA, UK uses PAYE/NI, UAE has no income tax but has end-of-service gratuity. Adding a new country must not require modifying core payroll code.

Additionally, salary structures use formulas like `HRA = BASIC * 0.4`. These formulas must be user-configurable without deployments.

## Decision

**Plugin architecture** with `mathjs`-based formula engine.

### Formula engine

`FormulaEngineService` wraps `mathjs.evaluate()` in a sandboxed scope. Component codes (`BASIC`, `HRA`, `PF_EE`) are the only variables. `import` and `createUnit` are blocked at startup to prevent sandbox escape. Formulas are evaluated in topological order of component dependency.

### Country plugins

Each country implements the `PayrollPlugin` interface:
```typescript
interface PayrollPlugin {
  countryCode: string;
  compute(context: PayrollContext): Promise<StatutoryResult>;
}
```

Plugins are registered in `PayrollModule` via DI. `PayrollService` selects the plugin by `employee.location.country`. New countries add a new plugin class and register it — zero changes to core.

## Consequences

- Formula validation catches syntax errors at save time (not at payroll run time).
- Country plugins are individually testable with 100% coverage.
- Payroll runs are BullMQ jobs (concurrency=20) — 10,000 employees complete in < 5 minutes.
- Payroll register is a pre-computed `payroll_run_items` table row, not a runtime calculation.
