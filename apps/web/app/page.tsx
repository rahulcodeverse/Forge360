const modules = [
  'Core HR',
  'Attendance',
  'Leave',
  'Payroll',
  'Performance',
  'Recruitment',
  'Learning',
  'Expenses',
  'Reports',
  'Admin'
];

export default function HomePage() {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
      <aside className="border-r bg-white p-6">
        <div className="mb-8">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-md bg-brand-600 text-sm font-bold text-white">HR</div>
          <h1 className="text-xl font-semibold">Enterprise HRMS</h1>
          <p className="text-sm text-slate-500">Global workforce operating system</p>
        </div>
        <nav className="grid gap-1">
          {modules.map((module) => (
            <a key={module} className="rounded-md px-3 py-2 text-sm hover:bg-teal-50 hover:text-brand-700" href={`#${module.toLowerCase().replaceAll(' ', '-')}`}>
              {module}
            </a>
          ))}
        </nav>
      </aside>
      <section className="p-6">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">Executive HR Dashboard</h2>
            <p className="text-slate-500">Headcount, leave, payroll, hiring, performance, and compliance in one workspace.</p>
          </div>
          <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white">Run Payroll</button>
        </header>
        <section className="grid gap-3 md:grid-cols-4">
          {[
            ['Headcount', '50'],
            ['Locations', '3'],
            ['Payroll Runs', '3'],
            ['Pending Approvals', '7']
          ].map(([label, value]) => (
            <article key={label} className="rounded-lg border bg-white p-4">
              <p className="text-sm text-slate-500">{label}</p>
              <strong className="text-2xl">{value}</strong>
            </article>
          ))}
        </section>
        <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <article id={module.toLowerCase().replaceAll(' ', '-')} key={module} className="rounded-lg border bg-white p-4">
              <h3 className="font-semibold">{module}</h3>
              <p className="mt-2 text-sm text-slate-500">Configured for Acme Corp with tenant isolation, audit logging, RBAC, and API-first contracts.</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

