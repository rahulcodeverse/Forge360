# Payroll Rollback Runbook

1. Only payroll runs in `processed` or `approved` state can be rolled back.
2. `paid` runs require finance approval and bank file reversal evidence.
3. Reversal creates a new audit event and never mutates immutable payslip artifacts.
4. Re-run payroll with corrected inputs and compare register diff before approval.

