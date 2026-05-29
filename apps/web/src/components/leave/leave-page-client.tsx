'use client';

import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { ApplyLeaveDialog } from './apply-leave-dialog';
import { LeaveBalanceSummary } from './leave-balance-summary';
import { LeaveRequestsTable } from './leave-requests-table';

export function LeavePageClient() {
  const [applyOpen, setApplyOpen] = useState(false);
  const queryClient = useQueryClient();
  const t = useTranslations('leave');
  const currentYear = new Date().getFullYear();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['leave', 'requests'],
    queryFn: () =>
      apiClient.get<{
        data: Array<{
          id: string;
          leaveType: { name: string };
          fromDate: string;
          toDate: string;
          durationDays: number;
          status: string;
          reason: string;
        }>;
      }>('/leave/requests'),
  });

  const { data: balances } = useQuery({
    queryKey: ['leave', 'balance', currentYear],
    queryFn: () =>
      apiClient.get<{
        data: Array<{
          leaveTypeName: string;
          available: number;
          taken: number;
          accrued: number;
          pending: number;
        }>;
      }>('/leave/balance', { year: currentYear }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/leave/requests/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leave'] });
      toast({ title: 'Leave request cancelled' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Apply for leave and track your requests
          </p>
        </div>
        <button
          type="button"
          onClick={() => setApplyOpen(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          {t('applyLeave')}
        </button>
      </div>

      {/* Leave balance summary */}
      <LeaveBalanceSummary balances={balances?.data ?? []} />

      {/* Requests table */}
      <div className="rounded-xl border bg-card">
        <div className="p-5 border-b">
          <h2 className="font-semibold">My Leave Requests</h2>
        </div>
        <LeaveRequestsTable
          requests={requests?.data ?? []}
          isLoading={isLoading}
          onCancel={(id) => cancelMutation.mutate(id)}
        />
      </div>

      {/* Apply leave dialog */}
      <ApplyLeaveDialog
        open={applyOpen}
        onOpenChange={setApplyOpen}
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: ['leave'] });
          setApplyOpen(false);
        }}
      />
    </div>
  );
}
