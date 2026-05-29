# ADR 0004: BullMQ Job Queue

## Decision

Use BullMQ backed by Redis for payroll runs, report generation, tenant provisioning, notification dispatch, and PDF generation.

## Rationale

These workloads require retries, delayed jobs, concurrency controls, and operational visibility.

