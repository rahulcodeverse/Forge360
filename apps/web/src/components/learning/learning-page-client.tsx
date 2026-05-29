'use client';

import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, BookOpenCheck, GraduationCap, LibraryBig, PlayCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@hrms/ui';

interface Course {
  id: string;
  title: string;
  description: string | null;
  type: string;
  durationMinutes: number;
  thumbnailUrl: string | null;
  contentUrl: string | null;
}

interface Enrollment {
  id: string;
  status: string;
  progressPercent: number;
  startedAt: string | null;
  completedAt: string | null;
  score: number | null;
  certificateUrl: string | null;
  course: Course;
}

export function LearningPageClient() {
  const t = useTranslations('learning');
  const queryClient = useQueryClient();

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['learning', 'courses'],
    queryFn: () =>
      apiClient.get<{ data: Course[]; meta: { total: number } }>('/learning/courses', {
        limit: 30,
      }),
  });

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['learning', 'my-enrollments'],
    queryFn: () => apiClient.get<{ data: Enrollment[] }>('/learning/my-enrollments'),
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => apiClient.post(`/learning/courses/${courseId}/enroll`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['learning'] });
      toast({ title: t('enrolled') });
    },
  });

  const progressMutation = useMutation({
    mutationFn: ({ courseId, progressPercent }: { courseId: string; progressPercent: number }) =>
      apiClient.put(`/learning/courses/${courseId}/progress`, { progressPercent }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['learning', 'my-enrollments'] });
      toast({ title: t('progressUpdated') });
    },
  });

  const enrollmentByCourse = new Map(
    (enrollments?.data ?? []).map((enrollment) => [enrollment.course.id, enrollment]),
  );
  const completedCount = (enrollments?.data ?? []).filter(
    (enrollment) => enrollment.status === 'completed',
  ).length;
  const averageProgress = average(
    (enrollments?.data ?? []).map((enrollment) => enrollment.progressPercent),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button type="button">
          <GraduationCap className="mr-2 h-4 w-4" />
          {t('trainingCalendar')}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t('courseLibrary')}
          value={courses?.meta.total ?? 0}
          icon={<LibraryBig className="h-5 w-5 text-blue-600" />}
        />
        <MetricCard
          title={t('enrolledCourses')}
          value={enrollments?.data.length ?? 0}
          icon={<BookOpenCheck className="h-5 w-5 text-violet-600" />}
        />
        <MetricCard
          title={t('completed')}
          value={completedCount}
          icon={<Award className="h-5 w-5 text-green-600" />}
        />
        <MetricCard
          title={t('averageProgress')}
          value={`${averageProgress}%`}
          icon={<PlayCircle className="h-5 w-5 text-amber-600" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>{t('courseCatalog')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {coursesLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-56 rounded-md" />
                  ))
                : (courses?.data ?? []).map((course) => {
                    const enrollment = enrollmentByCourse.get(course.id);
                    return (
                      <div
                        key={course.id}
                        className="flex min-h-56 flex-col rounded-md border bg-card p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <Badge variant="outline">{course.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {course.durationMinutes}m
                          </span>
                        </div>
                        <p className="mt-4 font-semibold">{course.title}</p>
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                          {course.description ?? t('noDescription')}
                        </p>
                        {enrollment ? (
                          <div className="mt-auto pt-4">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{enrollment.status}</span>
                              <span>{enrollment.progressPercent}%</span>
                            </div>
                            <ProgressBar value={enrollment.progressPercent} />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-3 w-full"
                              onClick={() =>
                                progressMutation.mutate({
                                  courseId: course.id,
                                  progressPercent: Math.min(100, enrollment.progressPercent + 25),
                                })
                              }
                              disabled={progressMutation.isPending}
                            >
                              {t('markProgress')}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            className="mt-auto"
                            onClick={() => enrollMutation.mutate(course.id)}
                            disabled={enrollMutation.isPending}
                          >
                            {t('enroll')}
                          </Button>
                        )}
                      </div>
                    );
                  })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('myLearning')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {enrollmentsLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 rounded-md" />
                ))
              : (enrollments?.data ?? []).map((enrollment) => (
                  <div key={enrollment.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{enrollment.course.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {enrollment.course.type}
                        </p>
                      </div>
                      <Badge variant={enrollment.status === 'completed' ? 'success' : 'secondary'}>
                        {enrollment.status}
                      </Badge>
                    </div>
                    <ProgressBar value={enrollment.progressPercent} />
                    {enrollment.certificateUrl ? (
                      <a
                        className="mt-2 block text-sm text-primary"
                        href={enrollment.certificateUrl}
                      >
                        {t('viewCertificate')}
                      </a>
                    ) : null}
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
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
