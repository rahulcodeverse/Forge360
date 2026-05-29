'use client';

import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock3, ReceiptText, Send, WalletCards } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@hrms/ui';

interface ExpenseClaim {
  id: string;
  title: string;
  claimDate: string;
  category: string;
  totalAmount: number;
  currency: string;
  status: string;
  employee?: {
    employeeCode: string;
    firstName: string;
    lastName: string;
    department?: { name: string } | null;
  } | null;
  items?: Array<{
    id: string;
    description: string;
    amount: number;
    currency: string;
  }>;
}

interface ExpenseSummary {
  totalAmount: number;
  draft: number;
  submitted: number;
  approved: number;
  paid: number;
  rejected: number;
}

export function ExpensesPageClient() {
  const t = useTranslations('expenses');
  const queryClient = useQueryClient();

  const { data: claims, isLoading: claimsLoading } = useQuery({
    queryKey: ['expenses', 'claims'],
    queryFn: () =>
      apiClient.get<{ data: ExpenseClaim[]; meta: { total: number } }>('/expenses/claims', {
        limit: 80,
      }),
  });

  const { data: summary } = useQuery({
    queryKey: ['expenses', 'summary'],
    queryFn: () => apiClient.get<{ data: ExpenseSummary }>('/expenses/summary'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/expenses/claims', {
        title: t('sampleClaimTitle'),
        category: 'travel',
        claimDate: new Date().toISOString(),
        currency: 'USD',
        items: [
          {
            description: t('sampleClaimItem'),
            amount: 42,
            currency: 'USD',
          },
        ],
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: t('claimCreated') });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/expenses/claims/${id}/submit`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: t('claimSubmitted') });
    },
  });

  const decisionMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'approved' | 'rejected' | 'paid' }) =>
      apiClient.post(`/expenses/claims/${id}/decision`, { decision, comment: t('approvedByHr') }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: t('claimUpdated') });
    },
  });

  const rows = claims?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button type="button" onClick={() => createMutation.mutate()}>
          <ReceiptText className="mr-2 h-4 w-4" />
          {t('newClaim')}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t('totalAmount')}
          value={formatCurrency(summary?.data.totalAmount ?? 0)}
          icon={<WalletCards className="h-5 w-5 text-blue-600" />}
        />
        <MetricCard
          title={t('submitted')}
          value={summary?.data.submitted ?? 0}
          icon={<Send className="h-5 w-5 text-violet-600" />}
        />
        <MetricCard
          title={t('approved')}
          value={summary?.data.approved ?? 0}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
        />
        <MetricCard
          title={t('paid')}
          value={summary?.data.paid ?? 0}
          icon={<Clock3 className="h-5 w-5 text-amber-600" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('claims')}</CardTitle>
        </CardHeader>
        <CardContent>
          {claimsLoading ? (
            <Skeleton className="h-80 rounded-md" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      {t('claim')}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      {t('employee')}
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      {t('amount')}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      {t('status')}
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((claim) => (
                    <tr key={claim.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{claim.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {claim.category} - {new Date(claim.claimDate).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {claim.employee
                          ? `${claim.employee.firstName} ${claim.employee.lastName}`
                          : t('self')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(claim.totalAmount, claim.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={claim.status === 'approved' ? 'success' : 'secondary'}>
                          {claim.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {claim.status === 'draft' ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => submitMutation.mutate(claim.id)}
                            >
                              {t('submit')}
                            </Button>
                          ) : null}
                          {claim.status === 'submitted' ? (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  decisionMutation.mutate({ id: claim.id, decision: 'rejected' })
                                }
                              >
                                {t('reject')}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() =>
                                  decisionMutation.mutate({ id: claim.id, decision: 'approved' })
                                }
                              >
                                {t('approve')}
                              </Button>
                            </>
                          ) : null}
                          {claim.status === 'approved' ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                decisionMutation.mutate({ id: claim.id, decision: 'paid' })
                              }
                            >
                              {t('markPaid')}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
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

function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
