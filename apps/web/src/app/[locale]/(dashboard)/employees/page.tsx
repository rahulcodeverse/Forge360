import { EmployeesPageClient } from '@/components/employees/employees-page-client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Employees' };

export default function EmployeesPage() {
  return <EmployeesPageClient />;
}
