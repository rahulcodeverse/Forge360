import { PayrollPageClient } from '@/components/payroll/payroll-page-client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Payroll' };

export default function PayrollPage() {
  return <PayrollPageClient />;
}
