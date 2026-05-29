import { DashboardClient } from '@/components/dashboard/dashboard-client';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');
  return <DashboardClient />;
}
