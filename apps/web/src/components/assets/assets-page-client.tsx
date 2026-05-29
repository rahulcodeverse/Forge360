'use client';

import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Laptop, PackageCheck, RotateCcw, Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@hrms/ui';

interface Asset {
  id: string;
  assetTag: string;
  type: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  status: string;
  activeAssignment?: AssetAssignment | null;
}

interface AssetAssignment {
  id: string;
  assignedAt: string;
  returnedAt: string | null;
  employee: {
    employeeCode: string;
    firstName: string;
    lastName: string;
    department?: { name: string } | null;
  };
  asset: {
    assetTag: string;
    type: string;
    brand: string | null;
    model: string | null;
  };
}

export function AssetsPageClient() {
  const t = useTranslations('assets');
  const queryClient = useQueryClient();

  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets', 'inventory'],
    queryFn: () =>
      apiClient.get<{ data: Asset[]; meta: { total: number } }>('/assets', { limit: 80 }),
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assets', 'assignments'],
    queryFn: () =>
      apiClient.get<{ data: AssetAssignment[]; meta: { total: number } }>('/assets/assignments', {
        limit: 80,
      }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/assets', {
        assetTag: `LAP-${Date.now().toString().slice(-6)}`,
        type: 'laptop',
        brand: 'Lenovo',
        model: 'ThinkPad E14',
        serialNumber: `SN${Date.now().toString().slice(-8)}`,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast({ title: t('assetCreated') });
    },
  });

  const returnMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      apiClient.post(`/assets/assignments/${assignmentId}/return`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast({ title: t('assetReturned') });
    },
  });

  const inventory = assets?.data ?? [];
  const activeAssignments = assignments?.data ?? [];
  const available = inventory.filter((asset) => asset.status === 'available').length;
  const assigned = inventory.filter((asset) => asset.status === 'assigned').length;
  const maintenance = inventory.filter((asset) => asset.status === 'maintenance').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button type="button" onClick={() => createMutation.mutate()}>
          <Laptop className="mr-2 h-4 w-4" />
          {t('addAsset')}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t('totalAssets')}
          value={inventory.length}
          icon={<Laptop className="h-5 w-5 text-blue-600" />}
          loading={assetsLoading}
        />
        <MetricCard
          title={t('available')}
          value={available}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          loading={assetsLoading}
        />
        <MetricCard
          title={t('assigned')}
          value={assigned}
          icon={<PackageCheck className="h-5 w-5 text-violet-600" />}
          loading={assetsLoading}
        />
        <MetricCard
          title={t('maintenance')}
          value={maintenance}
          icon={<Wrench className="h-5 w-5 text-amber-600" />}
          loading={assetsLoading}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>{t('inventory')}</CardTitle>
          </CardHeader>
          <CardContent>
            {assetsLoading ? (
              <Skeleton className="h-72 rounded-md" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        {t('asset')}
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        {t('serial')}
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        {t('owner')}
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        {t('status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((asset) => (
                      <tr key={asset.id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-medium">{asset.assetTag}</p>
                          <p className="text-xs text-muted-foreground">
                            {[asset.brand, asset.model].filter(Boolean).join(' ') || asset.type}
                          </p>
                        </td>
                        <td className="px-4 py-3">{asset.serialNumber ?? '-'}</td>
                        <td className="px-4 py-3">
                          {asset.activeAssignment?.employee
                            ? `${asset.activeAssignment.employee.firstName} ${asset.activeAssignment.employee.lastName}`
                            : t('unassigned')}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={asset.status === 'available' ? 'success' : 'secondary'}>
                            {asset.status}
                          </Badge>
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
            <CardTitle>{t('activeAssignments')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignmentsLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 rounded-md" />
                ))
              : activeAssignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-md border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {assignment.employee.firstName} {assignment.employee.lastName}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {assignment.asset.assetTag} -{' '}
                          {[assignment.asset.brand, assignment.asset.model]
                            .filter(Boolean)
                            .join(' ')}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => returnMutation.mutate(assignment.id)}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {t('return')}
                      </Button>
                    </div>
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
