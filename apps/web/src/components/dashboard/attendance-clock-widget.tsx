'use client';

import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { useState } from 'react';

interface AttendanceRecord {
  data: {
    status: string;
    clockIn: string | null;
    clockOut: string | null;
    totalHours: number | null;
  };
}

export function AttendanceClockWidget() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0]!;
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  const { data: todayRecord } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () =>
      apiClient.get<AttendanceRecord>(`/attendance/my/monthly`, { year, month }).then((res) => {
        const days = (
          res as unknown as {
            data: {
              days: Array<{
                date: string;
                clockIn: string | null;
                clockOut: string | null;
                status: string;
                totalHours: number | null;
              }>;
            };
          }
        ).data.days;
        return days.find((d) => d.date === today);
      }),
    refetchInterval: 60000,
  });

  const clockInMutation = useMutation({
    mutationFn: () => apiClient.post('/attendance/clock-in', {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({ title: 'Clocked in successfully', variant: 'default' });
    },
    onError: (err) => {
      toast({
        title: err instanceof Error ? err.message : 'Clock-in failed',
        variant: 'destructive',
      });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: () => apiClient.post('/attendance/clock-out', {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({ title: 'Clocked out successfully', variant: 'default' });
    },
    onError: (err) => {
      toast({
        title: err instanceof Error ? err.message : 'Clock-out failed',
        variant: 'destructive',
      });
    },
  });

  const hasClockIn = !!todayRecord?.clockIn;
  const hasClockOut = !!todayRecord?.clockOut;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Today's Attendance</h2>
      </div>

      <div className="space-y-3">
        {todayRecord?.clockIn && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Clock in</span>
            <span className="font-medium">
              {new Date(todayRecord.clockIn).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}

        {todayRecord?.clockOut && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Clock out</span>
            <span className="font-medium">
              {new Date(todayRecord.clockOut).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}

        {todayRecord?.totalHours && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total hours</span>
            <span className="font-medium">{todayRecord.totalHours.toFixed(1)}h</span>
          </div>
        )}

        <div className="pt-3 flex gap-2">
          {!hasClockIn && (
            <button
              type="button"
              onClick={() => clockInMutation.mutate()}
              disabled={clockInMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              {clockInMutation.isPending ? 'Clocking in...' : 'Clock In'}
            </button>
          )}

          {hasClockIn && !hasClockOut && (
            <button
              type="button"
              onClick={() => clockOutMutation.mutate()}
              disabled={clockOutMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {clockOutMutation.isPending ? 'Clocking out...' : 'Clock Out'}
            </button>
          )}

          {hasClockIn && hasClockOut && (
            <div className="flex-1 rounded-md bg-muted px-4 py-2 text-center text-sm text-muted-foreground">
              Attendance complete
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
