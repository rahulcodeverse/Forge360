import { randomUUID } from 'node:crypto';

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

async function main() {
  console.log('🌱 Seeding HRMS demo data...');

  // ─── Tenant ───────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'acme' },
    create: {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'Acme Corp',
      slug: 'acme',
      schemaName: 'acme',
      country: 'IN',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      plan: 'enterprise',
    },
    update: {},
  });
  console.log(`  ✓ Tenant: ${tenant.name}`);

  // ─── Locations ────────────────────────────────────────────────────────────
  const [mumbai, london, newYork] = await Promise.all([
    prisma.location.upsert({
      where: { id: 'loc-mumbai-0000-0000-000000000001' },
      create: {
        id: 'loc-mumbai-0000-0000-000000000001',
        tenantId: tenant.id,
        name: 'Mumbai',
        country: 'IN',
        state: 'Maharashtra',
        city: 'Mumbai',
        timezone: 'Asia/Kolkata',
      },
      update: {},
    }),
    prisma.location.upsert({
      where: { id: 'loc-london-0000-0000-000000000002' },
      create: {
        id: 'loc-london-0000-0000-000000000002',
        tenantId: tenant.id,
        name: 'London',
        country: 'GB',
        state: 'England',
        city: 'London',
        timezone: 'Europe/London',
      },
      update: {},
    }),
    prisma.location.upsert({
      where: { id: 'loc-newyork-000-0000-000000000003' },
      create: {
        id: 'loc-newyork-000-0000-000000000003',
        tenantId: tenant.id,
        name: 'New York',
        country: 'US',
        state: 'New York',
        city: 'New York City',
        timezone: 'America/New_York',
      },
      update: {},
    }),
  ]);
  console.log('  ✓ Locations: Mumbai, London, New York');

  // ─── Grades ───────────────────────────────────────────────────────────────
  const grades = await Promise.all(
    ['L1', 'L2', 'L3', 'L4'].map((name, i) =>
      prisma.grade.upsert({
        where: { id: `grade-${name}-000-0000-000000000001` },
        create: {
          id: `grade-${name}-000-0000-000000000001`,
          tenantId: tenant.id,
          name,
          code: name,
          level: i + 1,
        },
        update: {},
      }),
    ),
  );
  console.log('  ✓ Grades: L1–L4');

  // ─── Departments ─────────────────────────────────────────────────────────
  const departments = await Promise.all(
    ['Engineering', 'Sales', 'Finance', 'HR', 'Operations'].map((name) =>
      prisma.department.upsert({
        where: { id: `dept-${name.toLowerCase()}-0000-000000000001` },
        create: {
          id: `dept-${name.toLowerCase()}-0000-000000000001`,
          tenantId: tenant.id,
          name,
          code: name.toUpperCase().slice(0, 3),
        },
        update: {},
      }),
    ),
  );
  console.log('  ✓ Departments: Engineering, Sales, Finance, HR, Operations');

  // ─── Designations ─────────────────────────────────────────────────────────
  const designations = await Promise.all(
    [
      { name: 'Software Engineer', grade: grades[0]! },
      { name: 'Senior Software Engineer', grade: grades[1]! },
      { name: 'Engineering Manager', grade: grades[2]! },
      { name: 'VP Engineering', grade: grades[3]! },
      { name: 'Sales Executive', grade: grades[0]! },
      { name: 'Sales Manager', grade: grades[1]! },
      { name: 'HR Executive', grade: grades[0]! },
      { name: 'HR Manager', grade: grades[1]! },
    ].map(({ name, grade }) =>
      prisma.designation.upsert({
        where: { id: `desig-${name.replace(/\s/g, '').toLowerCase().slice(0, 10)}-0001` },
        create: {
          id: `desig-${name.replace(/\s/g, '').toLowerCase().slice(0, 10)}-0001`,
          tenantId: tenant.id,
          name,
          gradeId: grade.id,
        },
        update: {},
      }),
    ),
  );
  console.log('  ✓ Designations created');

  // ─── Super Admin user ─────────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash('Admin@12345', BCRYPT_ROUNDS);
  const adminUser = await prisma.user.upsert({
    where: { id: 'user-admin-00000-0000-000000000001' },
    create: {
      id: 'user-admin-00000-0000-000000000001',
      tenantId: tenant.id,
      email: 'admin@acme.hrms.local',
      passwordHash: adminPasswordHash,
      role: 'hr_admin',
      isActive: true,
    },
    update: {},
  });
  console.log('  ✓ Admin user: admin@acme.hrms.local / Admin@12345');

  // ─── 50 demo employees ────────────────────────────────────────────────────
  const firstNames = [
    'Rahul',
    'Priya',
    'Arjun',
    'Sneha',
    'Vikram',
    'Ananya',
    'Ravi',
    'Deepa',
    'Suresh',
    'Pooja',
    'James',
    'Sarah',
    'Michael',
    'Emily',
    'David',
    'Jessica',
    'Robert',
    'Ashley',
    'William',
    'Amanda',
    'Liam',
    'Oliver',
    'Noah',
    'Emma',
    'Ava',
    'Isabella',
    'Sophia',
    'Charlotte',
    'Mia',
    'Amelia',
    'Rajesh',
    'Kavita',
    'Sanjay',
    'Rekha',
    'Arun',
    'Sunita',
    'Mohan',
    'Geeta',
    'Harish',
    'Usha',
    'Tom',
    'Alice',
    'John',
    'Mary',
    'Charles',
    'Patricia',
    'Mark',
    'Barbara',
    'Paul',
    'Linda',
  ];
  const lastNames = [
    'Sharma',
    'Patel',
    'Kumar',
    'Singh',
    'Gupta',
    'Verma',
    'Joshi',
    'Nair',
    'Menon',
    'Pillai',
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Wilson',
    'Anderson',
    'Taylor',
    'Thomas',
    'Jackson',
    'White',
    'Harris',
    'Martin',
    'Thompson',
    'Moore',
    'Young',
    'Allen',
    'Shah',
    'Mehta',
    'Desai',
    'Bose',
    'Reddy',
    'Iyer',
    'Rao',
    'Choudhury',
    'Mishra',
    'Pandey',
    'Khan',
    'Ali',
    'Ahmed',
    'Hassan',
    'Ibrahim',
    'Malik',
    'Clarke',
    'Lewis',
    'Lee',
    'Walker',
  ];

  const locations = [mumbai, london, newYork];
  const depts = departments;

  let employeeCounter = 1;
  const createdEmployees: string[] = [];

  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[i]!;
    const lastName = lastNames[i]!;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@acme.com`;
    const location = locations[i % 3]!;
    const dept = depts[i % 5]!;
    const grade = grades[i % 4]!;
    const designation = designations[i % designations.length]!;
    const userId = `user-emp-${String(i).padStart(3, '0')}-0000-000000000001`;
    const empId = `emp-${String(i).padStart(4, '0')}-000000-0000-000000000001`;

    const passwordHash = await bcrypt.hash('Employee@123', BCRYPT_ROUNDS);

    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        tenantId: tenant.id,
        email,
        passwordHash,
        role: i < 3 ? 'hr_manager' : i < 10 ? 'manager' : 'employee',
        isActive: true,
      },
      update: {},
    });

    const joiningDate = new Date(2022, i % 12, (i % 28) + 1);

    await prisma.employee.upsert({
      where: { id: empId },
      create: {
        id: empId,
        tenantId: tenant.id,
        employeeCode: `EMP${String(employeeCounter++).padStart(4, '0')}`,
        userId,
        firstName,
        lastName,
        workEmail: email,
        phone: `+91${9000000000 + i}`,
        joiningDate,
        employmentType: 'full_time',
        employmentStatus: 'active',
        departmentId: dept.id,
        designationId: designation.id,
        gradeId: grade.id,
        locationId: location.id,
        reportingManagerId: i > 5 ? (createdEmployees[0] ?? null) : null,
      },
      update: {},
    });

    createdEmployees.push(empId);

    if ((i + 1) % 10 === 0) console.log(`  ✓ Created ${i + 1}/50 employees`);
  }

  // ─── Leave types ──────────────────────────────────────────────────────────
  await Promise.all([
    prisma.leaveType.upsert({
      where: { id: 'lt-casual-000-0000-000000000001' },
      create: {
        id: 'lt-casual-000-0000-000000000001',
        tenantId: tenant.id,
        name: 'Casual Leave',
        code: 'CL',
        isPaid: true,
        carryForwardLimit: 5,
        encashable: false,
        color: '#3B82F6',
      },
      update: {},
    }),
    prisma.leaveType.upsert({
      where: { id: 'lt-sick-00000-0000-000000000002' },
      create: {
        id: 'lt-sick-00000-0000-000000000002',
        tenantId: tenant.id,
        name: 'Sick Leave',
        code: 'SL',
        isPaid: true,
        carryForwardLimit: null,
        encashable: false,
        color: '#EF4444',
      },
      update: {},
    }),
    prisma.leaveType.upsert({
      where: { id: 'lt-earned-000-0000-000000000003' },
      create: {
        id: 'lt-earned-000-0000-000000000003',
        tenantId: tenant.id,
        name: 'Earned Leave',
        code: 'EL',
        isPaid: true,
        carryForwardLimit: 30,
        encashable: true,
        color: '#10B981',
      },
      update: {},
    }),
    prisma.leaveType.upsert({
      where: { id: 'lt-maternity-0-0000-000000000004' },
      create: {
        id: 'lt-maternity-0-0000-000000000004',
        tenantId: tenant.id,
        name: 'Maternity Leave',
        code: 'ML',
        isPaid: true,
        carryForwardLimit: null,
        encashable: false,
        genderRestricted: 'female',
        color: '#EC4899',
      },
      update: {},
    }),
  ]);
  console.log('  ✓ Leave types: CL, SL, EL, ML');

  // ─── Payroll components ───────────────────────────────────────────────────
  const payrollComponents = [
    {
      id: 'pc-basic-000000-0000-000000000001',
      name: 'Basic Salary',
      code: 'BASIC',
      type: 'earning',
      calculationType: 'fixed',
      isTaxable: true,
      order: 1,
    },
    {
      id: 'pc-hra-0000000-0000-000000000002',
      name: 'House Rent Allowance',
      code: 'HRA',
      type: 'earning',
      calculationType: 'formula',
      isTaxable: true,
      formulaExpression: 'BASIC * 0.4',
      order: 2,
    },
    {
      id: 'pc-convey-000-0000-000000000003',
      name: 'Conveyance',
      code: 'CONVEYANCE',
      type: 'earning',
      calculationType: 'fixed',
      isTaxable: false,
      fixedAmount: 1600,
      order: 3,
    },
    {
      id: 'pc-medical-00-0000-000000000004',
      name: 'Medical Allowance',
      code: 'MEDICAL',
      type: 'earning',
      calculationType: 'fixed',
      isTaxable: false,
      fixedAmount: 1250,
      order: 4,
    },
    {
      id: 'pc-pf-000000000-0000-000000000005',
      name: 'Provident Fund',
      code: 'PF_EE',
      type: 'deduction',
      calculationType: 'formula',
      isTaxable: false,
      formulaExpression: 'min(BASIC, 15000) * 0.12',
      order: 10,
    },
    {
      id: 'pc-esi-000000-0000-000000000006',
      name: 'ESI Employee',
      code: 'ESI_EE',
      type: 'deduction',
      calculationType: 'formula',
      isTaxable: false,
      formulaExpression: 'GROSS <= 21000 ? GROSS * 0.0075 : 0',
      order: 11,
    },
  ];

  await Promise.all(
    payrollComponents.map((c) =>
      prisma.payrollComponent.upsert({
        where: { id: c.id },
        create: { ...c, tenantId: tenant.id },
        update: {},
      }),
    ),
  );
  console.log('  ✓ Payroll components: BASIC, HRA, CONVEYANCE, MEDICAL, PF_EE, ESI_EE');

  // ─── Holiday calendars (2026) ─────────────────────────────────────────────
  const calendar = await prisma.holidayCalendar.upsert({
    where: { id: 'hcal-india-2026-0000-000000000001' },
    create: {
      id: 'hcal-india-2026-0000-000000000001',
      tenantId: tenant.id,
      name: 'India Holidays 2026',
      locationId: mumbai.id,
      year: 2026,
      isDefault: true,
    },
    update: {},
  });

  const indiaHolidays2026 = [
    { name: "New Year's Day", date: new Date('2026-01-01') },
    { name: 'Republic Day', date: new Date('2026-01-26') },
    { name: 'Holi', date: new Date('2026-03-03') },
    { name: 'Good Friday', date: new Date('2026-04-03') },
    { name: 'Independence Day', date: new Date('2026-08-15') },
    { name: 'Gandhi Jayanti', date: new Date('2026-10-02') },
    { name: 'Diwali', date: new Date('2026-10-19') },
    { name: 'Christmas', date: new Date('2026-12-25') },
  ];

  for (const h of indiaHolidays2026) {
    await prisma.holiday.upsert({
      where: { id: `hol-${h.date.toISOString().split('T')[0]}-0001` },
      create: {
        id: `hol-${h.date.toISOString().split('T')[0]}-0001`,
        calendarId: calendar.id,
        name: h.name,
        date: h.date,
        isOptional: false,
      },
      update: {},
    });
  }
  console.log('  ✓ India holidays 2026 (8 holidays)');

  // ─── Goal cycle ───────────────────────────────────────────────────────────
  await prisma.goalCycle.upsert({
    where: { id: 'gcycle-2026-annual-000000000001' },
    create: {
      id: 'gcycle-2026-annual-000000000001',
      tenantId: tenant.id,
      name: 'Annual 2026',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      type: 'annual',
      isActive: true,
    },
    update: {},
  });
  console.log('  ✓ Goal cycle: Annual 2026');

  console.log('\n✅ Seed complete! Demo credentials:');
  console.log('   Admin:    admin@acme.hrms.local  / Admin@12345');
  console.log('   Employee: rahul.sharma@acme.com  / Employee@123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
