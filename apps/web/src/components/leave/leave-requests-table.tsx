'use client';

import { format } from 'date-fns';

import { Skeleton } from '@hrms/ui';

interface LeaveRequest {
  id: string;
  leaveType: { name: string };
  fromDate: string;
  toDate: string;
  durationDays: number;
  status: string;
  reason: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

export function LeaveRequestsTable({
  requests,
  isLoading,
  onCancel,
}: {
  requests: LeaveRequest[];
  isLoading: boolean;
  onCancel: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="p-5 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-sm">No leave requests found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="px-5 py-3 font-medium">Type</th>
            <th className="px-5 py-3 font-medium">From</th>
            <th className="px-5 py-3 font-medium">To</th>
            <th className="px-5 py-3 font-medium">Days</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-5 py-3 font-medium">{req.leaveType.name}</td>
              <td className="px-5 py-3 text-muted-foreground">
                {format(new Date(req.fromDate), 'd MMM yyyy')}
              </td>
              <td className="px-5 py-3 text-muted-foreground">
                {format(new Date(req.toDate), 'd MMM yyyy')}
              </td>
              <td className="px-5 py-3">{req.durationDays}</td>
              <td className="px-5 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                    STATUS_COLORS[req.status] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {req.status}
                </span>
              </td>
              <td className="px-5 py-3">
                {req.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => onCancel(req.id)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
