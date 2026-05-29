'use client';

import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ClipboardCheck, FileText, ShieldCheck, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@hrms/ui';

interface OnboardingSession {
  id: string;
  employeeId: string | null;
  currentStep: number;
  totalSteps: number;
  completedAt: string | null;
  createdAt: string;
  progressPercent: number;
  employee?: {
    employeeCode: string;
    firstName: string;
    lastName: string;
    workEmail: string | null;
    department?: { name: string } | null;
    designation?: { name: string } | null;
  } | null;
}

export function OnboardingPageClient() {
  const t = useTranslations('onboarding');
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['onboarding', 'sessions'],
    queryFn: () =>
      apiClient.get<{ data: OnboardingSession[]; meta: { total: number } }>(
        '/onboarding/sessions',
        { limit: 50 },
      ),
  });

  const { data: mine } = useQuery({
    queryKey: ['onboarding', 'mine'],
    queryFn: () => apiClient.get<{ data: OnboardingSession | null }>('/onboarding/mine'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/onboarding/sessions', {
        totalSteps: 8,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      toast({ title: t('sessionCreated') });
    },
  });

  const stepMutation = useMutation({
    mutationFn: ({ id, step }: { id: string; step: number }) =>
      apiClient.patch(`/onboarding/sessions/${id}/steps/${step}`, {
        completed: true,
        completedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      toast({ title: t('stepSaved') });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/onboarding/sessions/${id}/complete`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      toast({ title: t('completed') });
    },
  });

  const allSessions = sessions?.data ?? [];
  const active = allSessions.filter((session) => !session.completedAt).length;
  const completed = allSessions.filter((session) => session.completedAt).length;
  const averageProgress =
    allSessions.length === 0
      ? 0
      : Math.round(
          allSessions.reduce((total, session) => total + session.progressPercent, 0) /
            allSessions.length,
        );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button type="button" onClick={() => createMutation.mutate()}>
          <UserPlus className="mr-2 h-4 w-4" />
          {t('startSession')}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t('activeSessions')}
          value={active}
          icon={<ClipboardCheck className="h-5 w-5 text-blue-600" />}
          loading={isLoading}
        />
        <MetricCard
          title={t('completedSessions')}
          value={completed}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          loading={isLoading}
        />
        <MetricCard
          title={t('averageProgress')}
          value={`${averageProgress}%`}
          icon={<ShieldCheck className="h-5 w-5 text-violet-600" />}
          loading={isLoading}
        />
        <MetricCard
          title={t('myProgress')}
          value={mine?.data ? `${mine.data.progressPercent}%` : '0%'}
          icon={<FileText className="h-5 w-5 text-amber-600" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>{t('sessions')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-72 rounded-md" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        {t('employee')}
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        {t('step')}
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        {t('progress')}
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        {t('actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSessions.map((session) => (
                      <tr key={session.id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {session.employee
                              ? `${session.employee.firstName} ${session.employee.lastName}`
                              : t('unassigned')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.employee?.department?.name ?? t('newHire')}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          {session.currentStep} / {session.totalSteps}
                        </td>
                        <td className="px-4 py-3">
                          <ProgressBar value={session.progressPercent} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {session.completedAt ? (
                            <Badge variant="success">{t('done')}</Badge>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  stepMutation.mutate({
                                    id: session.id,
                                    step: Math.min(session.currentStep + 1, session.totalSteps),
                                  })
                                }
                              >
                                {t('advance')}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => completeMutation.mutate(session.id)}
                              >
                                {t('complete')}
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('checklist')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              t('offerAcceptance'),
              t('personalDetails'),
              t('bankDetails'),
              t('documentCollection'),
              t('policyAcknowledgement'),
              t('assetAllocation'),
              t('managerIntro'),
              t('firstDayReady'),
            ].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-md border p-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  loading = false,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  loading?: boolean;
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
          <p className="mt-2 text-3xl font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{value}%</span>
    </div>
  );
}
