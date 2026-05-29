# ADR 0002: Payroll Plugin Engine

## Decision

Core payroll computes salary components, LOP, gross, deductions, and net. Country rules are isolated behind payroll plugins implementing the same interface.

## Rationale

Compliance changes frequently and differs by jurisdiction. Plugin isolation prevents country-specific branches from leaking into core payroll flow.

