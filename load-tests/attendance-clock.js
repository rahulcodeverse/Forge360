import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('clock_in_errors');
const clockInDuration = new Trend('clock_in_duration', true);

export const options = {
  scenarios: {
    concurrent_clock_ins: {
      executor: 'constant-vus',
      vus: 500,
      duration: '1m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<200'],
    clock_in_errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api/v1';

export default function () {
  const employeeToken = __ENV.EMPLOYEE_TOKEN || '';
  const tenantId = __ENV.TENANT_ID || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

  const res = http.post(
    `${BASE_URL}/attendance/clock-in`,
    JSON.stringify({ source: 'web' }),
    {
      headers: {
        Authorization: `Bearer ${employeeToken}`,
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
      },
    },
  );

  clockInDuration.add(res.timings.duration);

  const success = check(res, {
    'clock-in status 201 or 409': (r) => r.status === 201 || r.status === 409, // 409 = already clocked in
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  errorRate.add(!success);

  sleep(0.1);
}
