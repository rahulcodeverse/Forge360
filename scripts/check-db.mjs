import pg from 'pg';
const c = new pg.Client({ host: 'localhost', port: 5432, user: 'hrms', database: 'hrms' });
await c.connect();
const t = await c.query('SELECT COUNT(*) FROM public.tenants');
const e = await c.query('SELECT COUNT(*) FROM public.employees');
const u = await c.query('SELECT email FROM public.users LIMIT 3');
console.log('Tenants:', t.rows[0].count, '| Employees:', e.rows[0].count);
console.log('Demo users:', u.rows.map(r => r.email).join(', '));
await c.end();
