# Database Design

## Core Tables

- tenants
- tenant_settings
- subscription_plans
- users
- identities
- sessions
- roles
- permissions
- role_permissions
- user_roles
- abac_policies
- audit_logs
- legal_entities
- business_units
- departments
- teams
- cost_centers
- designations
- positions
- reporting_relationships
- employees
- employee_profiles
- employee_custom_fields
- employee_custom_field_values
- employee_documents
- employee_bank_accounts
- employee_skills
- employee_education
- employee_certifications
- employee_experience
- employee_family_members
- emergency_contacts

## Lifecycle Tables

- jobs
- job_postings
- candidates
- resumes
- candidate_pipeline_stages
- interview_schedules
- offers
- onboarding_plans
- onboarding_tasks
- background_checks
- assets
- asset_allocations
- attendance_events
- attendance_devices
- geofences
- shifts
- shift_assignments
- leave_types
- leave_policies
- leave_balances
- leave_requests
- payroll_cycles
- payroll_components
- salary_structures
- employee_compensation
- payroll_runs
- payslips
- compliance_rules
- compliance_filings
- dynamic_forms
- form_versions
- form_submissions
- workflow_definitions
- workflow_instances
- approval_tasks
- expense_claims
- performance_cycles
- goals
- reviews
- feedback
- courses
- learning_paths
- enrollments
- surveys
- recognitions
- helpdesk_tickets
- exit_cases

## Platform Tables

- rule_definitions
- rule_versions
- rule_evaluations
- formula_variables
- localization_profiles
- currency_rates
- tax_years
- integration_connectors
- integration_accounts
- webhooks
- notification_templates
- ai_knowledge_sources
- ai_conversations
- analytics_dashboards
- dashboard_widgets

## Design Notes

- Every business table includes `tenant_id`, `created_at`, `updated_at`, and audit metadata.
- Policy and rule tables are effective-dated and versioned.
- Custom fields are stored as metadata definitions plus typed values, with optional search indexing.
- Documents are stored in object storage with database metadata and permission checks.
- Payroll and compliance results store full calculation traces for auditability.

