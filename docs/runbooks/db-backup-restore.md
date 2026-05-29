# Database Backup and Restore Runbook

- Production uses automated RDS/Aurora backups plus point-in-time recovery.
- Tenant restore restores only the tenant schema unless platform metadata is affected.
- Always verify row counts, migrations, audit continuity, and payroll run checksums after restore.

