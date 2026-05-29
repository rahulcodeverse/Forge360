const state = {
  view: 'dashboard',
  metrics: [],
  modules: [],
  employees: [],
  jobs: [],
  leaveRequests: [],
  payrollRuns: [],
  complianceRules: [],
  workflows: [],
  forms: [],
};

const formatMetric = (metric) => {
  if (metric.unit === 'currency') return `$${(metric.value / 1000000).toFixed(1)}M`;
  if (metric.unit === 'percent') return `${metric.value}%`;
  return new Intl.NumberFormat().format(metric.value);
};

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.json();
}

async function postJson(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Failed to post ${path}`);
  return response.json();
}

async function refreshData() {
  [
    state.metrics,
    state.modules,
    state.employees,
    state.jobs,
    state.leaveRequests,
    state.payrollRuns,
    state.complianceRules,
    state.workflows,
    state.forms,
  ] = await Promise.all([
    loadJson('/api/v1/platform/analytics'),
    loadJson('/api/v1/workforce/modules'),
    loadJson('/api/v1/employees'),
    loadJson('/api/v1/recruitment/jobs'),
    loadJson('/api/v1/leave/requests'),
    loadJson('/api/v1/payroll/runs'),
    loadJson('/api/v1/compliance/rules'),
    loadJson('/api/v1/workflows'),
    loadJson('/api/v1/forms'),
  ]);
}

function renderHeading(title, text) {
  document.querySelector('#page-heading').innerHTML = `<h2>${title}</h2><p>${text}</p>`;
}

function renderMetrics() {
  return `<section class="metrics">${state.metrics
    .map(
      (metric) => `
        <article class="metric">
          <span>${metric.label}</span>
          <strong>${formatMetric(metric)}</strong>
          <small>Trend: ${metric.trend}</small>
        </article>
      `,
    )
    .join('')}</section>`;
}

function renderModules() {
  return `<div class="module-grid">${state.modules
    .map(
      (module) => `
        <article class="module-card">
          <strong>${module.name}</strong>
          <p>Lifecycle stage: ${module.lifecycleStage}</p>
          <span>${module.key}</span>
        </article>
      `,
    )
    .join('')}</div>`;
}

function renderEmployees() {
  return `<div class="table">${state.employees
    .map(
      (employee) => `
        <article class="person-card">
          <strong>${employee.displayName}</strong>
          <p>${employee.designation}<br />${employee.department}</p>
          <span>${employee.employeeNumber} - ${employee.workMode}</span>
        </article>
      `,
    )
    .join('')}</div>`;
}

function renderRecords(records, columns) {
  return `<div class="record-list">${records
    .map(
      (record) => `
        <article class="record-card">
          ${columns.map((column) => `<div><small>${column.label}</small><strong>${record[column.key]}</strong></div>`).join('')}
        </article>
      `,
    )
    .join('')}</div>`;
}

function renderBuilder(title, items) {
  return `
    <section class="builder">
      <article class="canvas">
        <h3>${title}</h3>
        ${items.map((item) => `<span>${item}</span>`).join('')}
      </article>
      <article class="panel">
        <h3>Configuration</h3>
        <p>Admins configure countries, legal entities, approvers, formulas, slabs, documents, and effective dates without writing code.</p>
        <div class="chips">
          <span>Versioned</span>
          <span>Effective dated</span>
          <span>Approval controlled</span>
          <span>Audit logged</span>
        </div>
      </article>
    </section>
  `;
}

function renderDashboard() {
  renderHeading('Forge360 Workforce OS', 'A full enterprise HRMS product workspace for global workforce lifecycle operations.');
  document.querySelector('#view').innerHTML = `
    ${renderMetrics()}
    <section class="lifecycle">
      <span>Recruit</span><span>Onboard</span><span>Manage</span><span>Pay</span><span>Grow</span><span>Engage</span><span>Exit</span>
    </section>
    <section class="split">
      <article class="panel">
        <h3>What this application contains</h3>
        <p>Core HR, organization, recruitment, onboarding, attendance, leave, shifts, payroll, compliance, workflows, forms, expenses, performance, learning, assets, engagement, helpdesk, exit, AI, analytics, and integrations.</p>
      </article>
      <article class="panel">
        <h3>Global rule design</h3>
        <p>Country rules are never hardcoded. Payroll, tax, compliance, leave, attendance, and policy behavior is represented as tenant-configured data.</p>
      </article>
    </section>
    <div class="section-title"><h3>Product Modules</h3><p>Use the left navigation to open working module screens.</p></div>
    ${renderModules()}
  `;
}

function renderView() {
  if (state.view === 'dashboard') return renderDashboard();

  if (state.view === 'people') {
    renderHeading('People and Core HR', 'Employee records, departments, designations, custom fields, documents, skills, family, banking, and lifecycle status.');
    document.querySelector('#view').innerHTML = `${renderMetrics()}${renderEmployees()}`;
    return;
  }

  if (state.view === 'recruitment') {
    renderHeading('Recruitment ATS', 'Jobs, candidate pipeline, interview scheduling, offer management, referrals, and AI resume screening.');
    document.querySelector('#view').innerHTML = renderRecords(state.jobs, [
      { key: 'title', label: 'Job' },
      { key: 'department', label: 'Department' },
      { key: 'stage', label: 'Pipeline Stage' },
      { key: 'applicants', label: 'Applicants' },
      { key: 'aiMatchScore', label: 'AI Match' },
    ]);
    return;
  }

  if (state.view === 'leave') {
    renderHeading('Leave Management', 'Dynamic leave types, balances, accrual policies, approval workflows, holidays, and escalations.');
    document.querySelector('#view').innerHTML = renderRecords(state.leaveRequests, [
      { key: 'employee', label: 'Employee' },
      { key: 'type', label: 'Leave Type' },
      { key: 'dates', label: 'Dates' },
      { key: 'status', label: 'Status' },
    ]);
    return;
  }

  if (state.view === 'payroll') {
    renderHeading('Payroll Engine', 'Configurable earnings, deductions, taxes, benefits, contributions, formulas, slabs, and payslips.');
    document.querySelector('#view').innerHTML = renderRecords(state.payrollRuns, [
      { key: 'cycle', label: 'Cycle' },
      { key: 'entity', label: 'Legal Entity' },
      { key: 'employees', label: 'Employees' },
      { key: 'grossPay', label: 'Gross Pay' },
      { key: 'status', label: 'Status' },
    ]);
    return;
  }

  if (state.view === 'compliance') {
    renderHeading('Global Compliance Engine', 'Configurable statutory rules, forms, filings, reports, document generation, and audit evidence.');
    document.querySelector('#view').innerHTML = renderRecords(state.complianceRules, [
      { key: 'name', label: 'Rule' },
      { key: 'namespace', label: 'Namespace' },
      { key: 'effectiveFrom', label: 'Effective From' },
      { key: 'formula', label: 'Formula' },
      { key: 'status', label: 'Status' },
    ]);
    return;
  }

  if (state.view === 'workflows') {
    renderHeading('Workflow Builder', 'No-code approvals, conditions, multi-level routing, escalations, SLA rules, and automation.');
    document.querySelector('#view').innerHTML =
      renderRecords(state.workflows, [
        { key: 'name', label: 'Workflow' },
        { key: 'steps', label: 'Steps' },
        { key: 'status', label: 'Status' },
      ]) + renderBuilder('Payroll Approval Flow', ['Start', 'Payroll Review', 'Finance Approval', 'Publish Payslips', 'End']);
    return;
  }

  if (state.view === 'forms') {
    renderHeading('Dynamic Form Builder', 'Joining forms, tax forms, HR forms, exit forms, surveys, file uploads, signatures, PDFs, and versioning.');
    document.querySelector('#view').innerHTML = renderRecords(state.forms, [
      { key: 'name', label: 'Form' },
      { key: 'category', label: 'Category' },
      { key: 'fields', label: 'Fields' },
      { key: 'version', label: 'Version' },
    ]);
    return;
  }

  if (state.view === 'analytics') {
    renderHeading('Analytics and BI', 'Headcount, attrition, hiring funnel, payroll cost, attendance trends, engagement, and custom dashboards.');
    document.querySelector('#view').innerHTML = `${renderMetrics()}${renderBuilder('Dashboard Builder', ['Metric', 'Filter', 'Chart', 'Drilldown', 'Export'])}`;
    return;
  }

  renderHeading('Forge360 AI', 'HR Copilot, AI recruitment, attrition prediction, workforce planning, OCR, and document intelligence.');
  document.querySelector('#view').innerHTML = `
    <section class="split">
      <article class="panel"><h3>HR Copilot</h3><p>Answers employee policy, leave, payroll, and compliance questions using permissioned tenant data.</p></article>
      <article class="panel"><h3>Document Intelligence</h3><p>Extracts data from resumes, receipts, contracts, joining forms, and exit documents.</p></article>
      <article class="panel"><h3>AI Recruitment</h3><p>Ranks resumes, matches candidates, and drafts job descriptions.</p></article>
      <article class="panel"><h3>AI Analytics</h3><p>Predicts attrition, retention, workforce demand, and payroll anomalies.</p></article>
    </section>
  `;
}

async function boot() {
  await refreshData();
  renderView();

  document.querySelectorAll('nav a').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      document.querySelectorAll('nav a').forEach((item) => item.classList.remove('active'));
      link.classList.add('active');
      state.view = link.dataset.view;
      renderView();
    });
  });

  document.querySelector('[data-action="seed-employee"]').addEventListener('click', async () => {
    await postJson('/api/v1/employees', {
      displayName: 'New Forge360 Employee',
      email: `employee${Date.now()}@forge360.example`,
      department: 'People Operations',
      designation: 'HR Generalist',
      workMode: 'Hybrid',
    });
    await refreshData();
    state.view = 'people';
    renderView();
  });

  document.querySelector('[data-action="seed-leave"]').addEventListener('click', async () => {
    await postJson('/api/v1/leave/requests', {
      employee: 'New Forge360 Employee',
      type: 'Annual Leave',
      dates: '2026-06-15 to 2026-06-16',
    });
    await refreshData();
    state.view = 'leave';
    renderView();
  });
}

boot().catch((error) => {
  document.body.innerHTML = `<pre>${error.message}</pre>`;
});
