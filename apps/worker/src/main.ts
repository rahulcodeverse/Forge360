import IORedis from 'ioredis';
import { Worker } from 'bullmq';

const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
const WORKER_CONCURRENCY = parseInt(process.env['WORKER_CONCURRENCY'] ?? '10', 10);

const redis = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

// ── Payroll run processor ────────────────────────────────────────────────────
const payrollWorker = new Worker(
  'payroll-run',
  async (job) => {
    const { runId, tenantId, month, year } = job.data as {
      runId: string;
      tenantId: string;
      month: number;
      year: number;
    };

    console.log(`Processing payroll run ${runId} for ${tenantId} (${year}-${month})`);
    // Full implementation in Step 7 — payroll engine
    await job.updateProgress(100);
    return { runId, processed: 0 };
  },
  { connection: redis, concurrency: WORKER_CONCURRENCY },
);

// ── Notification delivery processor ─────────────────────────────────────────
const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    const { notificationId } = job.data as { notificationId: string };
    console.log(`Processing notification ${notificationId}: ${job.name}`);
    // Email/SMS delivery implemented in Step 14
  },
  { connection: redis, concurrency: 50 },
);

// ── SLA escalation processor ─────────────────────────────────────────────────
const slaWorker = new Worker(
  'workflow-sla',
  async (job) => {
    const { requestId, moduleType, level } = job.data as {
      requestId: string;
      moduleType: string;
      level: number;
    };
    console.log(`SLA escalation: ${moduleType}/${requestId} level ${level}`);
    // Escalation logic implemented in Step 6
  },
  { connection: redis, concurrency: 20 },
);

// ── Report generation processor ──────────────────────────────────────────────
const reportWorker = new Worker(
  'report-generation',
  async (job) => {
    console.log(`Generating report: ${job.name}`);
    // Report generation implemented in Step 11
  },
  { connection: redis, concurrency: 5 },
);

// ── Tenant provisioning processor ────────────────────────────────────────────
const tenantWorker = new Worker(
  'tenant-provisioning',
  async (job) => {
    const { tenantId } = job.data as { tenantId: string };
    console.log(`Provisioning tenant ${tenantId}`);
    // Tenant schema creation implemented in Step 15
  },
  { connection: redis, concurrency: 3 },
);

const workers = [payrollWorker, notificationWorker, slaWorker, reportWorker, tenantWorker];

workers.forEach((w) => {
  w.on('failed', (job, err) => {
    console.error(`Worker ${w.name} — job ${job?.id} failed:`, err.message);
  });
  console.log(`Worker "${w.name}" started`);
});

process.on('SIGTERM', async () => {
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
});

console.log(`HRMS worker process started (concurrency=${WORKER_CONCURRENCY})`);
