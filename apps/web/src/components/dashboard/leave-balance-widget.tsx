'use client';

import { Calendar } from 'lucide-react';

interface LeaveBalanceItem {
  leaveTypeName: string;
  available: number;
  taken: number;
  accrued: number;
}

export function LeaveBalanceWidget({ balances }: { balances: LeaveBalanceItem[] }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Leave Balance</h2>
      </div>

      {balances.length === 0 ? (
        <p className="text-sm text-muted-foreground">No leave data available</p>
      ) : (
        <div className="space-y-3">
          {balances.slice(0, 4).map((balance) => (
            <div key={balance.leaveTypeName} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{balance.leaveTypeName}</span>
                <span className="text-muted-foreground">
                  {balance.available} / {balance.accrued} days
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-primary"
                  style={{
                    width: `${balance.accrued > 0 ? (balance.available / balance.accrued) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
