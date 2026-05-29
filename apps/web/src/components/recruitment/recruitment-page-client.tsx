'use client';

import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BriefcaseBusiness, CalendarDays, CheckCircle2, ClipboardList, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@hrms/ui';

interface Requisition {
  id: string;
  title: string;
  vacancies: number;
  status: string;
  department?: { name: string } | null;
  grade?: { name: string } | null;
  location?: { name: string; country: string } | null;
  _count?: { postings: number };
}

interface Application {
  id: string;
  stage: string;
  candidate: { name: string; email: string; phone?: string | null; source?: string | null };
  posting: {
    requisition: {
      title: string;
      department?: { name: string } | null;
    };
  };
  interviews?: Array<{ id: string; scheduledAt: string | null; rating: number | null }>;
  offer?: { status: string } | null;
}

interface RecruitmentAnalytics {
  totalApplications: number;
  byStage: Record<string, number>;
  hired: number;
  rejected: number;
  offerAcceptanceRate: number;
}

const STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

export function RecruitmentPageClient() {
  const t = useTranslations('recruitment');
  const queryClient = useQueryClient();

  const { data: requisitions, isLoading: requisitionsLoading } = useQuery({
    queryKey: ['recruitment', 'requisitions'],
    queryFn: () =>
      apiClient.get<{ data: Requisition[]; meta: { total: number } }>('/recruitment/requisitions', {
        limit: 6,
      }),
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['recruitment', 'applications'],
    queryFn: () =>
      apiClient.get<{ data: Application[]; meta: { total: number } }>('/recruitment/applications', {
        limit: 80,
      }),
  });

  const { data: analytics } = useQuery({
    queryKey: ['recruitment', 'analytics'],
    queryFn: () => apiClient.get<{ data: RecruitmentAnalytics }>('/recruitment/analytics'),
  });

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      apiClient.put(`/recruitment/applications/${id}/stage`, { stage }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
      toast({ title: t('stageUpdated') });
    },
  });

  const groupedApplications = STAGES.map((stage) => ({
    stage,
    items: (applications?.data ?? []).filter((application) => application.stage === stage),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button type="button">
          <BriefcaseBusiness className="mr-2 h-4 w-4" />
          {t('newRequisition')}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t('applications')}
          value={analytics?.data.totalApplications ?? 0}
          icon={<Users className="h-5 w-5 text-blue-600" />}
        />
        <MetricCard
          title={t('openRoles')}
          value={requisitions?.meta.total ?? 0}
          icon={<BriefcaseBusiness className="h-5 w-5 text-violet-600" />}
        />
        <MetricCard
          title={t('hired')}
          value={analytics?.data.hired ?? 0}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
        />
        <MetricCard
          title={t('offerAcceptance')}
          value={`${analytics?.data.offerAcceptanceRate ?? 0}%`}
          icon={<ClipboardList className="h-5 w-5 text-amber-600" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('activeRequisitions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requisitionsLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 rounded-md" />
                ))
              : (requisitions?.data ?? []).map((requisition) => (
                  <div key={requisition.id} className="rounded-md border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{requisition.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {requisition.department?.name ?? t('unassigned')} -{' '}
                          {requisition.location?.name ?? t('remote')}
                        </p>
                      </div>
                      <Badge variant={requisition.status === 'approved' ? 'success' : 'secondary'}>
                        {requisition.status}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {requisition.vacancies} {t('vacancies')}
                      </span>
                      <span>
                        {requisition._count?.postings ?? 0} {t('postings')}
                      </span>
                    </div>
                  </div>
                ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('pipeline')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 xl:grid-cols-6">
              {groupedApplications.map(({ stage, items }) => (
                <div key={stage} className="min-h-80 rounded-md border bg-muted/30">
                  <div className="flex items-center justify-between border-b px-3 py-2">
                    <p className="text-sm font-semibold capitalize">{stage}</p>
                    <Badge variant="outline">{items.length}</Badge>
                  </div>
                  <div className="space-y-2 p-2">
                    {applicationsLoading ? (
                      <Skeleton className="h-28 rounded-md" />
                    ) : (
                      items.map((application) => (
                        <div
                          key={application.id}
                          className="rounded-md border bg-card p-3 shadow-sm"
                        >
                          <p className="text-sm font-medium">{application.candidate.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {application.posting.requisition.title}
                          </p>
                          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {application.interviews?.[0]?.scheduledAt
                              ? new Date(application.interviews[0].scheduledAt).toLocaleDateString()
                              : t('noInterview')}
                          </p>
                          {stage !== 'hired' && stage !== 'rejected' ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-3 w-full"
                              onClick={() =>
                                stageMutation.mutate({
                                  id: application.id,
                                  stage: nextStage(stage),
                                })
                              }
                              disabled={stageMutation.isPending}
                            >
                              {t('moveNext')}
                            </Button>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
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
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon}
        </div>
        <p className="mt-2 text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function nextStage(stage: string) {
  const index = STAGES.indexOf(stage);
  return STAGES[Math.min(index + 1, STAGES.length - 2)] ?? 'screening';
}
