'use client';

import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BarChart3, Download, FileSpreadsheet, PieChart, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@hrms/ui';

interface Segment {
  name: string;
  count: number;
}

interface HeadcountReport {
  total: number;
  byDepartment: Segment[];
  byLocation: Segment[];
  byGrade: Segment[];
  byStatus: Segment[];
  byGender: Segment[];
  joinedThisMonth: number;
  exitedThisMonth: number;
  attritionRate: number;
}

interface SalaryRegisterItem {
  id: string;
  employee?: { employeeCode: string; firstName: string; lastName: string } | null;
  gross: number;
  tax: number;
  net: number;
}

interface SalaryRegister {
  month: number;
  year: number;
  status: string;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  items: SalaryRegisterItem[];
}

interface LeaveLiability {
  year: number;
  totalEmployees: number;
  totalPendingEncashableDays: number;
  balances: Array<{
    employee: { employeeCode: string; firstName: string; lastName: string };
    leaveType: { name: string };
    closing: number;
  }>;
}

export function ReportsPageClient() {
  const t = useTranslations('reports');
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: headcount, isLoading: headcountLoading } = useQuery({
    queryKey: ['reports', 'headcount'],
    queryFn: () => apiClient.get<{ data: HeadcountReport }>('/reports/headcount'),
  });

  const { data: salary, isLoading: salaryLoading } = useQuery({
    queryKey: ['reports', 'salary-register', month, year],
    queryFn: () =>
      apiClient.get<{ data: SalaryRegister | { status: 'no_run' } }>('/reports/salary-register', {
        month,
        year,
      }),
  });

  const { data: leaveLiability } = useQuery({
    queryKey: ['reports', 'leave-liability', year],
    queryFn: () => apiClient.get<{ data: LeaveLiability }>('/reports/leave-liability', { year }),
  });

  const exportMutation = useMutation({
    mutationFn: (type: string) =>
      apiClient.post<{ data: { jobId: string } }>('/reports/export', {
        type,
        format: 'csv',
        filters: { month, year },
      }),
    onSuccess: (response) => toast({ title: t('exportQueued'), description: response.data.jobId }),
  });

  const salaryData = isSalaryRegister(salary?.data) ? salary.data : null;

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
            variant="outline"
            onClick={() => exportMutation.mutate('headcount')}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('exportHeadcount')}
          </Button>
          <Button type="button" onClick={() => exportMutation.mutate('salary_register')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {t('exportSalary')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t('headcount')}
          value={headcount?.data.total ?? 0}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          loading={headcountLoading}
        />
        <MetricCard
          title={t('joinedThisMonth')}
          value={headcount?.data.joinedThisMonth ?? 0}
          icon={<BarChart3 className="h-5 w-5 text-green-600" />}
          loading={headcountLoading}
        />
        <MetricCard
          title={t('attritionRate')}
          value={`${headcount?.data.attritionRate ?? 0}%`}
          icon={<PieChart className="h-5 w-5 text-red-600" />}
          loading={headcountLoading}
        />
        <MetricCard
          title={t('leaveLiability')}
          value={leaveLiability?.data.totalPendingEncashableDays ?? 0}
          icon={<FileSpreadsheet className="h-5 w-5 text-violet-600" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('departmentBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {headcountLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 rounded-md" />
                ))
              : (headcount?.data.byDepartment ?? []).map((segment) => (
                  <BarRow key={segment.name} segment={segment} total={headcount?.data.total ?? 0} />
                ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('locationBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(headcount?.data.byLocation ?? []).map((segment) => (
              <BarRow key={segment.name} segment={segment} total={headcount?.data.total ?? 0} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('salaryRegister')}</CardTitle>
            {salaryData ? (
              <Badge variant="secondary">{salaryData.status}</Badge>
            ) : (
              <Badge variant="outline">{t('noPayrollRun')}</Badge>
            )}
          </CardHeader>
          <CardContent>
            {salaryLoading ? (
              <Skeleton className="h-64 rounded-md" />
            ) : salaryData ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        {t('employee')}
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        {t('gross')}
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        {t('tax')}
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        {t('net')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryData.items.slice(0, 12).map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {item.employee?.firstName} {item.employee?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.employee?.employeeCode}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(item.gross)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(item.tax)}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(item.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('noPayrollRunDescription')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('leaveLiability')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(leaveLiability?.data.balances ?? []).slice(0, 10).map((balance) => (
              <div
                key={`${balance.employee.employeeCode}-${balance.leaveType.name}`}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {balance.employee.firstName} {balance.employee.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{balance.leaveType.name}</p>
                </div>
                <span className="font-semibold">{balance.closing}</span>
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

function BarRow({ segment, total }: { segment: Segment; total: number }) {
  const percent = total === 0 ? 0 : Math.round((segment.count / total) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{segment.name}</span>
        <span className="text-muted-foreground">{segment.count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function isSalaryRegister(
  value: SalaryRegister | { status: 'no_run' } | undefined,
): value is SalaryRegister {
  return Boolean(value && value.status !== 'no_run');
}
