import { spawnSync } from 'node:child_process';

const result = spawnSync('npx', ['prisma', 'validate', '--schema', 'prisma/schema.prisma'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://hrms:hrms@localhost:5432/hrms',
  },
});

process.exit(result.status ?? 1);
