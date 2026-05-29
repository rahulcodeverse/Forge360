import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, 'seed-data.generated.json');

const tenant = { id: '00000000-0000-4000-8000-000000000001', name: 'Acme Corp', slug: 'acme', schema: 'tenant_acme', region: 'ap-south-1' };
const departments = ['Engineering', 'Sales', 'Finance', 'HR', 'Operations'].map((name, index) => ({ id: id(index + 10), tenantId: tenant.id, name, code: name.toUpperCase().replaceAll(' ', '_') }));
const locations = [
  { id: id(30), name: 'Mumbai', code: 'MUM', country: 'IN', timezone: 'Asia/Kolkata', currency: 'INR' },
  { id: id(31), name: 'London', code: 'LON', country: 'UK', timezone: 'Europe/London', currency: 'GBP' },
  { id: id(32), name: 'New York', code: 'NYC', country: 'US', timezone: 'America/New_York', currency: 'USD' },
].map((location) => ({ ...location, tenantId: tenant.id }));

const employees = Array.from({ length: 50 }, (_, index) => ({
  id: id(100 + index),
  tenantId: tenant.id,
  employeeCode: `ACME-${String(index + 1).padStart(4, '0')}`,
  firstName: `Employee${index + 1}`,
  lastName: 'Demo',
  workEmail: `employee${index + 1}@acme.example`,
  personalEmail: `employee${index + 1}@personal.example`,
  joiningDate: '2025-04-01',
  employmentType: 'full_time',
  employmentStatus: 'active',
  departmentId: departments[index % departments.length].id,
  locationId: locations[index % locations.length].id,
}));

const payrollRuns = [
  { month: 2, year: 2026, status: 'paid', employeeCount: 50 },
  { month: 3, year: 2026, status: 'paid', employeeCount: 50 },
  { month: 4, year: 2026, status: 'approved', employeeCount: 50 },
];

await mkdir(dirname(out), { recursive: true });
await writeFile(out, JSON.stringify({ tenant, departments, locations, employees, payrollRuns }, null, 2));
console.log(`Seed data written to ${out}`);

function id(n) {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

