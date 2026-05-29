'use client';

import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

import { Skeleton } from '@hrms/ui';

interface LeaveRequest {
  id: string;
  employee: { firstName: string; lastName: string; employeeCode: string };
  leaveType: { name: string };
  fromDate: string;
  toDate: string;
  durationDays: number;
  reason: string;
  status: string;
}

export function ManagerDashboardClient() {
  const queryClient = useQueryClient();

  const { data: pendingLeaves, isLoading } = useQuery({
    queryKey: ['manager', 'leave', 'pending'],
    queryFn: () =>
      apiClient.get<{ data: LeaveRequest[] }>('/leave/requests', { status: 'pending' }),
  });

  const decisionMutation = useMutation({
    mutationFn: ({
      id,
      decision,
      comment,
    }: {
      id: string;
      decision: 'approved' | 'rejected';
      comment?: string;
    }) => apiClient.post(`/leave/requests/${id}/decision`, { decision, comment }),
    onSuccess: (_, { decision }) => {
      void queryClient.invalidateQueries({ queryKey: ['manager', 'leave'] });
      toast({ title: `Leave request ${decision}` });
    },
    onError: (err) => {
      toast({
        title: 'Action failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Manager Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Team approvals and overview</p>
      </div>

      {/* Pending leave approvals */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold">Pending Leave Approvals</h2>
          {pendingLeaves?.data && pendingLeaves.data.length > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white">
              {pendingLeaves.data.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : pendingLeaves?.data.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <CheckCircle className="mx-auto h-8 w-8 mb-2 opacity-50 text-green-600" />
            <p className="text-sm">No pending approvals</p>
          </div>
        ) : (
          <div className="divide-y">
            {pendingLeaves?.data.map((req) => (
              <div key={req.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {req.employee.firstName} {req.employee.lastName}
                      <span className="ml-2 text-xs text-muted-foreground font-normal">
                        ({req.employee.employeeCode})
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {req.leaveType.name} · {req.durationDays} day(s) ·{' '}
                      {format(new Date(req.fromDate), 'd MMM')} –{' '}
                      {format(new Date(req.toDate), 'd MMM yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 italic">"{req.reason}"</p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => decisionMutation.mutate({ id: req.id, decision: 'approved' })}
                      disabled={decisionMutation.isPending}
                      className="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => decisionMutation.mutate({ id: req.id, decision: 'rejected' })}
                      disabled={decisionMutation.isPending}
                      className="flex items-center gap-1.5 rounded-md border border-destructive px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
