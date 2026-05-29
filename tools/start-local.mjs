import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const publicDir = join(root, 'apps', 'web', 'public');
const port = Number(process.env.PORT ?? 4200);

const modules = [
  { key: 'core-hr', name: 'Core HR', lifecycleStage: 'employment' },
  { key: 'organization', name: 'Organization Management', lifecycleStage: 'employment' },
  { key: 'recruitment', name: 'Recruitment ATS', lifecycleStage: 'prehire' },
  { key: 'onboarding', name: 'Onboarding', lifecycleStage: 'joining' },
  { key: 'attendance', name: 'Attendance Management', lifecycleStage: 'employment' },
  { key: 'leave', name: 'Leave Management', lifecycleStage: 'employment' },
  { key: 'shift', name: 'Shift Management', lifecycleStage: 'employment' },
  { key: 'payroll', name: 'Payroll Engine', lifecycleStage: 'employment' },
  { key: 'compliance', name: 'Global Compliance Engine', lifecycleStage: 'employment' },
  { key: 'forms', name: 'Dynamic Form Builder', lifecycleStage: 'platform' },
  { key: 'workflows', name: 'Dynamic Workflow Builder', lifecycleStage: 'platform' },
  { key: 'policies', name: 'Dynamic Policy Builder', lifecycleStage: 'platform' },
  { key: 'expenses', name: 'Expense Management', lifecycleStage: 'employment' },
  { key: 'performance', name: 'Performance Management', lifecycleStage: 'growth' },
  { key: 'learning', name: 'Learning Management', lifecycleStage: 'growth' },
  { key: 'assets', name: 'Asset Management', lifecycleStage: 'employment' },
  { key: 'engagement', name: 'Employee Engagement', lifecycleStage: 'employment' },
  { key: 'helpdesk', name: 'Helpdesk', lifecycleStage: 'employment' },
  { key: 'exit', name: 'Exit Management', lifecycleStage: 'retirement' },
  { key: 'ai', name: 'Forge360 AI', lifecycleStage: 'platform' },
  { key: 'analytics', name: 'Analytics and BI', lifecycleStage: 'platform' },
  { key: 'marketplace', name: 'Integrations Marketplace', lifecycleStage: 'platform' },
];

const employees = [
  {
    id: 'emp_1001',
    employeeNumber: 'F360-1001',
    displayName: 'Aarav Mehta',
    email: 'aarav.mehta@forge360.example',
    status: 'active',
    department: 'People Operations',
    designation: 'People Operations Lead',
    workMode: 'Hybrid',
  },
  {
    id: 'emp_1002',
    employeeNumber: 'F360-1002',
    displayName: 'Maya Chen',
    email: 'maya.chen@forge360.example',
    status: 'active',
    department: 'Platform Engineering',
    designation: 'Principal Engineer',
    workMode: 'Remote',
  },
];

const jobs = [
  { id: 'job_1', title: 'Senior Backend Engineer', department: 'Platform Engineering', stage: 'Interview', applicants: 48, aiMatchScore: 91 },
  { id: 'job_2', title: 'Payroll Implementation Consultant', department: 'People Operations', stage: 'Offer', applicants: 23, aiMatchScore: 88 },
  { id: 'job_3', title: 'Customer Success Manager', department: 'Revenue', stage: 'Screening', applicants: 64, aiMatchScore: 84 },
];

const leaveRequests = [
  { id: 'leave_1', employee: 'Aarav Mehta', type: 'Annual Leave', dates: '2026-06-10 to 2026-06-12', status: 'Manager Approval' },
  { id: 'leave_2', employee: 'Maya Chen', type: 'Sick Leave', dates: '2026-06-03', status: 'Approved' },
];

const payrollRuns = [
  { id: 'pay_2026_05', cycle: 'May 2026', entity: 'Forge360 Global', employees: 24850, grossPay: '$18.4M', status: 'Ready for approval' },
  { id: 'pay_2026_04', cycle: 'April 2026', entity: 'Forge360 Global', employees: 24610, grossPay: '$18.1M', status: 'Published' },
];

const complianceRules = [
  {
    id: 'rule_1',
    name: 'Configurable Employer Contribution',
    namespace: 'payroll',
    effectiveFrom: '2026-01-01',
    formula: 'grossPay * tenantConfiguredRate',
    status: 'Active',
  },
  {
    id: 'rule_2',
    name: 'Generic Tax Filing Declaration',
    namespace: 'compliance',
    effectiveFrom: '2026-01-01',
    formula: 'sum(taxableComponents)',
    status: 'Draft',
  },
];

const workflows = [
  { id: 'wf_1', name: 'Leave Approval', steps: 'Start > Manager > Condition > HR > End', status: 'Active' },
  { id: 'wf_2', name: 'Payroll Approval', steps: 'Start > Payroll Review > Finance > Publish > End', status: 'Draft' },
  { id: 'wf_3', name: 'Onboarding', steps: 'Start > Documents > Background Check > Assets > Welcome > End', status: 'Active' },
];

const forms = [
  { id: 'form_1', name: 'Joining Form', category: 'joining', fields: 14, version: 3 },
  { id: 'form_2', name: 'Tax Declaration', category: 'tax', fields: 18, version: 2 },
  { id: 'form_3', name: 'Exit Interview', category: 'exit', fields: 9, version: 1 },
];

const analytics = [
  { key: 'headcount', label: 'Headcount', value: 24850, unit: 'count', trend: 'up' },
  { key: 'attrition', label: 'Attrition', value: 8.4, unit: 'percent', trend: 'down' },
  { key: 'payroll_cost', label: 'Payroll Cost', value: 18400000, unit: 'currency', trend: 'flat' },
  { key: 'engagement', label: 'Engagement Score', value: 82, unit: 'score', trend: 'up' },
];

const routes = {
  '/api/v1/health': { status: 'ok', service: 'forge360-local', timestamp: new Date().toISOString() },
  '/api/v1/workforce/modules': modules,
  '/api/v1/workforce/suite': {
    product: 'Forge360 Workforce OS',
    tagline: 'Building Better Workplaces',
    architecture: 'multi-tenant, configurable, cloud-native, AI-powered',
    warning: 'This local runner is a development preview. Production requires database persistence, auth, queue workers, and cloud deployment.',
    modules,
  },
  '/api/v1/employees': employees,
  '/api/v1/recruitment/jobs': jobs,
  '/api/v1/leave/requests': leaveRequests,
  '/api/v1/payroll/runs': payrollRuns,
  '/api/v1/compliance/rules': complianceRules,
  '/api/v1/workflows': workflows,
  '/api/v1/forms': forms,
  '/api/v1/platform/analytics': analytics,
  '/api/v1/platform/security': {
    authentication: ['email', 'mobile_otp', 'google', 'microsoft', 'linkedin', 'github', 'saml', 'oauth2', 'mfa'],
    authorization: ['rbac', 'abac', 'purpose_based_access', 'tenant_scopes'],
    controls: ['audit_logs', 'ip_restrictions', 'session_management', 'encryption', 'gdpr', 'dpdp', 'soc2_ready', 'iso27001_ready'],
  },
};

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://localhost:${port}`);

  if (request.method === 'POST' && url.pathname === '/api/v1/employees') {
    const input = await readJsonBody(request);
    const employee = {
      id: `emp_${employees.length + 1001}`,
      employeeNumber: input.employeeNumber ?? `F360-${employees.length + 1001}`,
      displayName: input.displayName ?? 'New Employee',
      email: input.email ?? 'new.employee@forge360.example',
      status: 'active',
      department: input.department ?? 'People Operations',
      designation: input.designation ?? 'Employee',
      workMode: input.workMode ?? 'Hybrid',
    };
    employees.push(employee);
    sendJson(response, employee, 201);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/v1/leave/requests') {
    const input = await readJsonBody(request);
    const requestRecord = {
      id: `leave_${leaveRequests.length + 1}`,
      employee: input.employee ?? 'New Employee',
      type: input.type ?? 'Annual Leave',
      dates: input.dates ?? 'To be scheduled',
      status: 'Manager Approval',
    };
    leaveRequests.push(requestRecord);
    sendJson(response, requestRecord, 201);
    return;
  }

  if (url.pathname in routes) {
    sendJson(response, routes[url.pathname]);
    return;
  }

  const assetPath = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  try {
    const file = await readFile(join(publicDir, assetPath));
    response.writeHead(200, { 'content-type': contentTypes[extname(assetPath)] ?? 'application/octet-stream' });
    response.end(file);
  } catch {
    response.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: 'Not found' }));
  }
}).listen(port, () => {
  console.log(`Forge360 Workforce OS running at http://localhost:${port}`);
});

function sendJson(response, value, status = 200) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value, null, 2));
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}
