import { ManagerDashboardClient } from '@/components/manager/manager-dashboard-client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Manager Dashboard' };

export default function ManagerPage() {
  return <ManagerDashboardClient />;
}
