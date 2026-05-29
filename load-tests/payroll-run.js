import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  scenarios: {
    payroll_run: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '2m', target: 20 },  // Simulate 20 concurrent workers
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api/v1';
const ACCESS_TOKEN = __ENV.ACCESS_TOKEN || '';

export default function () {
  const headers = {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'X-Tenant-ID': __ENV.TENANT_ID || 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  };

  // Test payroll run trigger
  const triggerRes = http.post(
    `${BASE_URL}/payroll/runs`,
    JSON.stringify({ month: 5, year: 2026 }),
    { headers },
  );

  const success = check(triggerRes, {
    'trigger status is 201 or 200': (r) => r.status === 201 || r.status === 200,
    'response has runId': (r) => {
      const body = r.json();
      return !!(body && typeof body === 'object' && 'data' in body);
    },
  });
  errorRate.add(!success);

  sleep(1);

  // Poll for processing status
  const listRes = http.get(`${BASE_URL}/payroll/runs`, { headers });
  check(listRes, {
    'list runs returns 200': (r) => r.status === 200,
  });

  sleep(2);
}
