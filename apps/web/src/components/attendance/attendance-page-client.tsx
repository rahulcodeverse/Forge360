'use client';

import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Clock, MapPin, RotateCcw, Timer, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@hrms/ui';

interface LiveSummary {
  date: string;
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  notMarked: number;
  updatedAt: string;
}

interface AttendanceDay {
  date: string;
  status: string;
  clockIn: string | null;
  clockOut: string | null;
  totalHours: number;
  isLate: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
}

interface MonthlySheet {
  employee: { id: string; fullName: string; employeeCode: string };
  year: number;
  month: number;
  days: AttendanceDay[];
  summary: {
    present: number;
    absent: number;
    halfDay: number;
    late: number;
    leave: number;
    holidays: number;
    weekends: number;
    totalHours: number;
  };
}

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  isNightShift: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  present: 'border-green-200 bg-green-50 text-green-800',
  absent: 'border-red-200 bg-red-50 text-red-800',
  half_day: 'border-amber-200 bg-amber-50 text-amber-800',
  leave: 'border-violet-200 bg-violet-50 text-violet-800',
  weekend: 'border-slate-200 bg-slate-50 text-slate-500',
  holiday: 'border-sky-200 bg-sky-50 text-sky-800',
};

export function AttendancePageClient() {
  const t = useTranslations('attendance');
  const queryClient = useQueryClient();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['attendance', 'live-summary'],
    queryFn: () => apiClient.get<{ data: LiveSummary }>('/attendance/live-summary'),
    refetchInterval: 30000,
  });

  const { data: sheet, isLoading: sheetLoading } = useQuery({
    queryKey: ['attendance', 'monthly', year, month],
    queryFn: () => apiClient.get<{ data: MonthlySheet }>('/attendance/my/monthly', { year, month }),
  });

  const { data: shifts } = useQuery({
    queryKey: ['attendance', 'shifts'],
    queryFn: () => apiClient.get<{ data: Shift[] }>('/attendance/shifts'),
  });

  const clockInMutation = useMutation({
    mutationFn: () => apiClient.post('/attendance/clock-in', { source: 'web' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({ title: t('clockInSuccess') });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: () => apiClient.post('/attendance/clock-out', {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({ title: t('clockOutSuccess') });
    },
  });

  const regularizeMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/attendance/regularize', {
        date: today.toISOString().slice(0, 10),
        reason: 'Submitted from employee attendance dashboard',
      }),
    onSuccess: () => toast({ title: t('regularizeSubmitted') }),
  });

  const currentDay = useMemo(
    () => sheet?.data.days.find((day) => day.date === today.toISOString().slice(0, 10)),
    [sheet?.data.days, today],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => clockInMutation.mutate()}
            disabled={clockInMutation.isPending}
          >
            <Clock className="mr-2 h-4 w-4" />
            {t('clockIn')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => clockOutMutation.mutate()}
            disabled={clockOutMutation.isPending}
          >
            <Timer className="mr-2 h-4 w-4" />
            {t('clockOut')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => regularizeMutation.mutate()}
            disabled={regularizeMutation.isPending}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('regularize')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t('present')}
          value={summary?.data.present}
          loading={summaryLoading}
          icon={<Users className="h-5 w-5 text-green-600" />}
          caption={`${t('of')} ${summary?.data.totalEmployees ?? 0}`}
        />
        <MetricCard
          title={t('absent')}
          value={summary?.data.absent}
          loading={summaryLoading}
          icon={<Users className="h-5 w-5 text-red-600" />}
          caption={t('employees')}
        />
        <MetricCard
          title={t('late')}
          value={summary?.data.late}
          loading={summaryLoading}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          caption={t('clockIns')}
        />
        <MetricCard
          title={t('onLeave')}
          value={summary?.data.onLeave}
          loading={summaryLoading}
          icon={<CalendarClock className="h-5 w-5 text-violet-600" />}
          caption={t('approvedLeaves')}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('monthlySheet')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {sheet?.data.employee.fullName ?? t('myAttendance')} - {month}/{year}
              </p>
            </div>
            {currentDay ? <StatusBadge status={currentDay.status} /> : null}
          </CardHeader>
          <CardContent>
            {sheetLoading ? (
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 rounded-md" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
                {(sheet?.data.days ?? []).map((day) => (
                  <div
                    key={day.date}
                    className={`min-h-24 rounded-md border p-3 ${STATUS_STYLES[day.status] ?? 'bg-card'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{new Date(day.date).getDate()}</span>
                      {day.isLate ? <span className="text-xs font-medium">Late</span> : null}
                    </div>
                    <p className="mt-2 text-xs capitalize">{day.status.replace('_', ' ')}</p>
                    {day.clockIn ? (
                      <p className="mt-2 text-xs">
                        {formatTime(day.clockIn)} -{' '}
                        {day.clockOut ? formatTime(day.clockOut) : t('open')}
                      </p>
                    ) : null}
                    {day.totalHours ? (
                      <p className="text-xs">{day.totalHours.toFixed(1)}h</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('monthSummary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryRow label={t('present')} value={sheet?.data.summary.present ?? 0} />
              <SummaryRow label={t('absent')} value={sheet?.data.summary.absent ?? 0} />
              <SummaryRow label={t('late')} value={sheet?.data.summary.late ?? 0} />
              <SummaryRow
                label={t('totalHours')}
                value={`${sheet?.data.summary.totalHours ?? 0}h`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('publishedShifts')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(shifts?.data ?? []).slice(0, 5).map((shift) => (
                <div key={shift.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{shift.name}</p>
                    {shift.isNightShift ? <Badge variant="secondary">{t('night')}</Badge> : null}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {shift.startTime} - {shift.endTime}, {shift.breakDuration}m break
                  </p>
                </div>
              ))}
              {shifts?.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noShifts')}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  loading,
  icon,
  caption,
}: {
  title: string;
  value: number | undefined;
  loading: boolean;
  icon: React.ReactNode;
  caption: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon}
        </div>
        {loading ? (
          <Skeleton className="mt-3 h-8 w-20" />
        ) : (
          <p className="mt-2 text-3xl font-bold">{value ?? 0}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === 'present' ? 'success' : status === 'absent' ? 'destructive' : 'secondary';
  return <Badge variant={variant}>{status.replace('_', ' ')}</Badge>;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
