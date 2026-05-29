# ADR 0004 — Job Queue: BullMQ with Redis

**Status**: Accepted  
**Date**: 2026-05-29

## Decision

**BullMQ** (Redis-backed) for all asynchronous work: payroll runs, email/SMS dispatch, PDF generation, report exports, SLA escalations, tenant provisioning.

### Why BullMQ over alternatives

- **vs. pg-boss (PostgreSQL-backed)**: BullMQ's Redis-based priority queues offer sub-millisecond job throughput needed for 10,000-employee payroll runs. pg-boss is simpler but limited to ~100 jobs/sec.
- **vs. Kafka/SQS**: Operational complexity disproportionate to the scale. BullMQ supports delayed jobs (SLA timers), repeatable jobs (cron report scheduling), and priority queues out of the box.

### Queue list

| Queue | Concurrency | Purpose |
|---|---|---|
| `payroll-run` | 20 | Parallel payroll computation |
| `payslip-generation` | 5 | Puppeteer PDF rendering |
| `notifications` | 50 | Email/SMS delivery |
| `workflow-sla` | 20 | Approval SLA timers |
| `report-generation` | 5 | Large CSV/PDF exports |
| `bulk-import` | 3 | Employee CSV processing |
| `tenant-provisioning` | 3 | New tenant schema setup |

## Consequences

- Redis is a required dependency. ElastiCache Redis (multi-AZ) in production.
- BullBoard dashboard available at `/admin/queues` (super_admin only) for job monitoring.
- Job retention: completed jobs kept for 1,000 entries; failed jobs kept for 5,000 entries.
