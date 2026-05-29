import express from 'express';
import puppeteer, { Browser } from 'puppeteer';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const PORT = parseInt(process.env['PDF_SERVICE_PORT'] ?? '3002', 10);
const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
  }
  return browser;
}

async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

// Express HTTP API for synchronous PDF generation
const app = express();
app.use(express.json({ limit: '10mb' }));

app.post('/render', async (req, res) => {
  const { html } = req.body as { html?: string };
  if (!html) {
    res.status(400).json({ error: 'html is required' });
    return;
  }
  try {
    const pdf = await renderHtmlToPdf(html);
    res.set('Content-Type', 'application/pdf');
    res.send(pdf);
  } catch (err) {
    console.error('PDF render error', err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', browserConnected: browser?.connected ?? false });
});

// BullMQ worker for async payslip generation
const redis = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

const payslipWorker = new Worker(
  'payslip-generation',
  async (job) => {
    const { html, s3Key } = job.data as { html: string; s3Key: string };
    const pdfBuffer = await renderHtmlToPdf(html);
    console.log(`Generated PDF for ${s3Key}: ${pdfBuffer.length} bytes`);
    // Upload to S3 is handled by the API service after receiving the buffer
    return { s3Key, size: pdfBuffer.length, buffer: pdfBuffer.toString('base64') };
  },
  { connection: redis, concurrency: 5 },
);

payslipWorker.on('failed', (job, err) => {
  console.error(`Payslip job ${job?.id} failed:`, err);
});

app.listen(PORT, () => {
  console.log(`PDF service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await payslipWorker.close();
  if (browser) await browser.close();
  process.exit(0);
});
