'use client';

import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Flag, MessageSquareText, Target, UsersRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Skeleton } from '@hrms/ui';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  weight: number;
  targetValue: number | null;
  actualValue: number | null;
  unit: string | null;
  score: number | null;
  status: string;
  cycle?: { name: string } | null;
  checkIns?: Array<{
    id: string;
    actualValue: number | null;
    progressNote: string | null;
    createdAt: string;
  }>;
}

interface GoalCycle {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface ReviewCycle {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  timeline: Record<string, string>;
}

interface CalibrationData {
  totalReviewed: number;
  averageRating: number;
  distribution: Array<{ rating: number; count: number }>;
}

export function PerformancePageClient() {
  const t = useTranslations('performance');
  const queryClient = useQueryClient();
  const [checkInGoalId, setCheckInGoalId] = useState<string | null>(null);
  const [checkInValue, setCheckInValue] = useState('');
  const [checkInNote, setCheckInNote] = useState('');

  const { data: cycles } = useQuery({
    queryKey: ['performance', 'cycles'],
    queryFn: () => apiClient.get<{ data: GoalCycle[] }>('/performance/cycles'),
  });

  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ['performance', 'goals'],
    queryFn: () => apiClient.get<{ data: Goal[] }>('/performance/goals'),
  });

  const { data: reviews } = useQuery({
    queryKey: ['performance', 'review-cycles'],
    queryFn: () => apiClient.get<{ data: ReviewCycle[] }>('/performance/review-cycles'),
  });

  const activeReviewCycle = reviews?.data.find((cycle) => cycle.isActive) ?? reviews?.data[0];

  const { data: calibration } = useQuery({
    queryKey: ['performance', 'calibration', activeReviewCycle?.id],
    queryFn: () =>
      apiClient.get<{ data: CalibrationData }>(
        `/performance/calibration/${activeReviewCycle?.id ?? ''}`,
      ),
    enabled: Boolean(activeReviewCycle?.id),
  });

  const checkInMutation = useMutation({
    mutationFn: ({
      goalId,
      actualValue,
      progressNote,
    }: {
      goalId: string;
      actualValue?: number;
      progressNote: string;
    }) => apiClient.post(`/performance/goals/${goalId}/check-in`, { actualValue, progressNote }),
    onSuccess: () => {
      setCheckInGoalId(null);
      setCheckInValue('');
      setCheckInNote('');
      void queryClient.invalidateQueries({ queryKey: ['performance', 'goals'] });
      toast({ title: t('checkInSaved') });
    },
  });

  const totalWeight = (goals?.data ?? []).reduce((sum, goal) => sum + goal.weight, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button type="button">
          <Target className="mr-2 h-4 w-4" />
          {t('addGoal')}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t('activeGoals')}
          value={goals?.data.length ?? 0}
          icon={<Flag className="h-5 w-5 text-blue-600" />}
        />
        <MetricCard
          title={t('goalWeight')}
          value={`${totalWeight}%`}
          icon={<Target className="h-5 w-5 text-green-600" />}
        />
        <MetricCard
          title={t('reviewCycles')}
          value={reviews?.data.length ?? 0}
          icon={<MessageSquareText className="h-5 w-5 text-violet-600" />}
        />
        <MetricCard
          title={t('averageRating')}
          value={calibration?.data.averageRating ?? 0}
          icon={<BarChart3 className="h-5 w-5 text-amber-600" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>{t('okrTracker')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goalsLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-32 rounded-md" />
                ))
              : (goals?.data ?? []).map((goal) => (
                  <div key={goal.id} className="rounded-md border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{goal.title}</p>
                          <Badge variant="outline">{goal.weight}%</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {goal.description ?? goal.cycle?.name ?? t('noDescription')}
                        </p>
                      </div>
                      <Badge variant={goal.status === 'active' ? 'success' : 'secondary'}>
                        {goal.status}
                      </Badge>
                    </div>
                    <ProgressBar value={goalProgress(goal)} />
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {t('target')}: {goal.targetValue ?? '-'} {goal.unit ?? ''}
                      </span>
                      <span>
                        {t('actual')}: {goal.actualValue ?? 0} {goal.unit ?? ''}
                      </span>
                      <span>
                        {t('score')}: {goal.score ?? '-'}
                      </span>
                    </div>
                    {checkInGoalId === goal.id ? (
                      <div className="mt-4 grid gap-2 md:grid-cols-[120px_1fr_auto]">
                        <Input
                          type="number"
                          placeholder={t('actual')}
                          value={checkInValue}
                          onChange={(event) => setCheckInValue(event.target.value)}
                        />
                        <Input
                          placeholder={t('progressNote')}
                          value={checkInNote}
                          onChange={(event) => setCheckInNote(event.target.value)}
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            const payload: {
                              goalId: string;
                              actualValue?: number;
                              progressNote: string;
                            } = {
                              goalId: goal.id,
                              progressNote: checkInNote,
                            };
                            if (checkInValue) payload.actualValue = Number(checkInValue);
                            checkInMutation.mutate(payload);
                          }}
                          disabled={checkInMutation.isPending}
                        >
                          {t('saveCheckIn')}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => setCheckInGoalId(goal.id)}
                      >
                        {t('checkIn')}
                      </Button>
                    )}
                  </div>
                ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('activeCycles')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(cycles?.data ?? []).map((cycle) => (
                <div key={cycle.id} className="rounded-md border p-3">
                  <p className="font-medium">{cycle.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {cycle.type} - {new Date(cycle.endDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('calibration')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('reviewed')}</span>
                <span className="font-semibold">{calibration?.data.totalReviewed ?? 0}</span>
              </div>
              {(calibration?.data.distribution ?? []).map((bucket) => (
                <div key={bucket.rating} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>
                      {bucket.rating} {t('stars')}
                    </span>
                    <span>{bucket.count}</span>
                  </div>
                  <ProgressBar
                    value={distributionPercent(bucket.count, calibration?.data.totalReviewed ?? 0)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('reviewTimeline')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(reviews?.data ?? []).slice(0, 3).map((review) => (
                <div key={review.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{review.name}</p>
                    <UsersRound className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {Object.keys(review.timeline ?? {}).length} {t('milestones')}
                  </p>
                </div>
              ))}
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

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function goalProgress(goal: Goal) {
  if (!goal.targetValue || goal.targetValue <= 0) return goal.score ? goal.score * 20 : 0;
  return ((goal.actualValue ?? 0) / goal.targetValue) * 100;
}

function distributionPercent(count: number, total: number) {
  if (total === 0) return 0;
  return (count / total) * 100;
}
