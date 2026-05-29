'use client';

interface Balance {
  leaveTypeName: string;
  available: number;
  taken: number;
  accrued: number;
  pending: number;
}

export function LeaveBalanceSummary({ balances }: { balances: Balance[] }) {
  if (balances.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {balances.map((b) => (
        <div key={b.leaveTypeName} className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">{b.leaveTypeName}</p>
          <p className="mt-1 text-2xl font-bold">{b.available}</p>
          <p className="text-xs text-muted-foreground">
            {b.taken} taken · {b.pending} pending
          </p>
        </div>
      ))}
    </div>
  );
}
