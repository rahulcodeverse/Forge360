'use client';

import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, TrendingUp, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@hrms/ui';

import { AttendanceClockWidget } from './attendance-clock-widget';
import { LeaveBalanceWidget } from './leave-balance-widget';
import { QuickActionsWidget } from './quick-actions-widget';

interface HeadcountSummary {
  data: {
    total: number;
    present: number;
    onLeave: number;
    joinedThisMonth: number;
  };
}

export function DashboardClient() {
  const t = useTranslations('dashboard');
  const currentYear = new Date().getFullYear();

  const { data: attendance } = useQuery({
    queryKey: ['attendance', 'live-summary'],
    queryFn: () =>
      apiClient.get<{
        data: { present: number; absent: number; late: number; totalEmployees: number };
      }>('/attendance/live-summary'),
    refetchInterval: 30000,
  });

  const { data: leaveBalance } = useQuery({
    queryKey: ['leave', 'balance', currentYear],
    queryFn: () =>
      apiClient.get<{
        data: Array<{ leaveTypeName: string; available: number; taken: number; accrued: number }>;
      }>('/leave/balance', { year: currentYear }),
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Good {greeting()}, User!</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Present Today"
          value={attendance?.data.present ?? '-'}
          subtitle={`of ${attendance?.data.totalEmployees ?? 0} employees`}
          icon={<Users className="h-5 w-5" />}
          color="text-green-600"
        />
        <StatCard
          title="Absent"
          value={attendance?.data.absent ?? '-'}
          subtitle="employees"
          icon={<Users className="h-5 w-5" />}
          color="text-red-600"
        />
        <StatCard
          title="Late Today"
          value={attendance?.data.late ?? '-'}
          subtitle="clock-ins"
          icon={<Clock className="h-5 w-5" />}
          color="text-yellow-600"
        />
        <StatCard
          title="Leave Balance"
          value={leaveBalance?.data[0]?.available ?? '-'}
          subtitle="casual leave days"
          icon={<Calendar className="h-5 w-5" />}
          color="text-blue-600"
        />
      </div>

      {/* Main widgets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <AttendanceClockWidget />
        </div>
        <div className="lg:col-span-1">
          <LeaveBalanceWidget balances={leaveBalance?.data ?? []} />
        </div>
        <div className="lg:col-span-1">
          <QuickActionsWidget />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span className={color}>{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}
