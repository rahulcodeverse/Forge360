# RBAC Matrix

| Capability | Employee | Manager | HR Admin | Payroll Admin | Recruiter | Finance | IT Admin | Super Admin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| View own profile | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Edit own profile | Limited | Limited | Yes | Limited | Limited | No | No | Yes |
| View team profiles | No | Yes | Yes | Limited | Limited | No | No | Yes |
| Manage org structure | No | No | Yes | No | No | No | No | Yes |
| Manage candidates | No | Interview only | Yes | No | Yes | No | No | Yes |
| Approve leave | No | Yes | Yes | No | No | No | No | Yes |
| Run payroll | No | No | No | Yes | No | No | No | Yes |
| Configure payroll rules | No | No | No | Yes | No | No | No | Yes |
| Configure compliance | No | No | Yes | Yes | No | No | No | Yes |
| Manage workflows | No | No | Yes | Yes | No | No | No | Yes |
| View analytics | Own | Team | HR | Payroll | Hiring | Cost | IT | All |
| Manage integrations | No | No | Limited | Limited | Limited | Limited | Yes | Yes |

ABAC policies further restrict access by tenant, legal entity, country profile, department, cost center, data classification, employment type, and purpose.

