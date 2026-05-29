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
    scaleTarget: '100,000+ employees per enterprise tenant',
    architecture: 'multi-tenant, configurable, cloud-native, AI-powered',
    modules,
  },
  '/api/v1/employees': employees,
  '/api/v1/organization/org-chart': {
    root: { id: 'le_global', name: 'Forge360 Global' },
    children: [{ id: 'dept_people', name: 'People Operations' }, { id: 'dept_engineering', name: 'Platform Engineering' }],
  },
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

function sendJson(response, value) {
  response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value, null, 2));
}
