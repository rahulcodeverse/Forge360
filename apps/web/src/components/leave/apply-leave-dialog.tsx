'use client';

import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { createLeaveRequestSchema } from '@hrms/shared-types';

type FormValues = z.infer<typeof createLeaveRequestSchema>;

interface LeaveType {
  id: string;
  name: string;
  code: string;
}

export function ApplyLeaveDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { data: leaveTypes } = useQuery({
    queryKey: ['leave', 'types'],
    queryFn: () => apiClient.get<{ data: LeaveType[] }>('/leave/types'),
    enabled: open,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(createLeaveRequestSchema),
    defaultValues: {
      isHalfDay: false,
      reason: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => apiClient.post('/leave/requests', data),
    onSuccess: () => {
      toast({ title: 'Leave request submitted successfully' });
      form.reset();
      onSuccess();
    },
    onError: (err) => {
      toast({
        title: 'Failed to submit leave request',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
        <h2 className="text-lg font-semibold mb-4">Apply for Leave</h2>

        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Leave Type</label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...form.register('leaveTypeId')}
            >
              <option value="">Select leave type</option>
              {leaveTypes?.data.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name}
                </option>
              ))}
            </select>
            {form.formState.errors.leaveTypeId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.leaveTypeId.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">From Date</label>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...form.register('fromDate')}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">To Date</label>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...form.register('toDate')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Reason</label>
            <textarea
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Brief reason for leave..."
              {...form.register('reason')}
            />
            {form.formState.errors.reason && (
              <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="halfDay"
              className="h-4 w-4 rounded border"
              {...form.register('isHalfDay')}
            />
            <label htmlFor="halfDay" className="text-sm">
              Half day leave
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
