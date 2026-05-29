create table tenants (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tenant_settings (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  setting_key text not null,
  setting_value jsonb not null,
  unique (tenant_id, setting_key)
);

create table legal_entities (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  name text not null,
  code text not null,
  location_profile jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table organization_units (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  legal_entity_id uuid references legal_entities(id),
  parent_id uuid references organization_units(id),
  unit_type text not null,
  code text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table employees (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  employee_number text not null,
  legal_entity_id uuid not null references legal_entities(id),
  department_id uuid references organization_units(id),
  manager_id uuid references employees(id),
  display_name text not null,
  email text not null,
  status text not null,
  designation text not null,
  location_profile_id text not null,
  custom_fields jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, employee_number),
  unique (tenant_id, email)
);

create table dynamic_field_definitions (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  entity_name text not null,
  field_key text not null,
  label text not null,
  data_type text not null,
  required boolean not null default false,
  validation jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, entity_name, field_key)
);

create table rule_definitions (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  namespace text not null,
  code text not null,
  name text not null,
  version integer not null,
  status text not null,
  effective_from date not null,
  effective_to date,
  conditions jsonb not null default '[]',
  formula jsonb,
  slabs jsonb not null default '[]',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, namespace, code, version)
);

create table workflow_definitions (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  name text not null,
  category text not null,
  version integer not null,
  status text not null,
  effective_from date not null,
  effective_to date,
  steps jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table form_definitions (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  name text not null,
  category text not null,
  version integer not null,
  effective_from date not null,
  effective_to date,
  fields jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payroll_components (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  code text not null,
  name text not null,
  component_type text not null,
  calculation_mode text not null,
  rule_id uuid not null references rule_definitions(id),
  effective_from date not null,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table audit_logs (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  actor_id uuid,
  action text not null,
  resource_type text not null,
  resource_id text not null,
  before_value jsonb,
  after_value jsonb,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index employees_tenant_status_idx on employees (tenant_id, status);
create index rule_definitions_lookup_idx on rule_definitions (tenant_id, namespace, code, status, effective_from);
create index audit_logs_tenant_created_idx on audit_logs (tenant_id, created_at desc);
