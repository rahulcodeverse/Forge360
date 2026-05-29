/**
 * Calculates inclusive leave duration. Weekend/holiday exclusion belongs to
 * tenant policy and is passed in as configured non-working dates.
 * @param {{ fromDate: string; toDate: string; nonWorkingDates?: string[] }} input
 */
export function calculateLeaveDuration(input) {
  const nonWorking = new Set(input.nonWorkingDates ?? []);
  const from = new Date(`${input.fromDate}T00:00:00.000Z`);
  const to = new Date(`${input.toDate}T00:00:00.000Z`);
  if (Number.isNaN(from.valueOf()) || Number.isNaN(to.valueOf()) || from > to) {
    throw new Error('Invalid leave date range');
  }

  let days = 0;
  for (let cursor = new Date(from); cursor <= to; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const key = cursor.toISOString().slice(0, 10);
    if (!nonWorking.has(key)) days += 1;
  }
  return days;
}

/**
 * @param {{ opening: number; accrued: number; taken: number; pending: number; carryForwardLimit?: number; accrualAmount: number }} balance
 */
export function accrueLeave(balance) {
  const uncappedClosing = balance.opening + balance.accrued + balance.accrualAmount - balance.taken - balance.pending;
  const closing = typeof balance.carryForwardLimit === 'number' ? Math.min(uncappedClosing, balance.carryForwardLimit) : uncappedClosing;
  return {
    ...balance,
    accrued: balance.accrued + balance.accrualAmount,
    closing,
  };
}

/**
 * @param {{ opening: number; accrued: number; taken: number; pending: number; closing: number }} balance
 * @param {{ durationDays: number; status: 'approved' | 'rejected' }} decision
 */
export function applyLeaveApproval(balance, decision) {
  if (decision.durationDays <= 0) throw new Error('Leave duration must be positive');
  if (decision.status === 'rejected') {
    return {
      ...balance,
      pending: Math.max(0, balance.pending - decision.durationDays),
      closing: balance.opening + balance.accrued - balance.taken - Math.max(0, balance.pending - decision.durationDays),
    };
  }

  const nextTaken = balance.taken + decision.durationDays;
  const nextPending = Math.max(0, balance.pending - decision.durationDays);
  const nextClosing = balance.opening + balance.accrued - nextTaken - nextPending;
  if (nextClosing < 0) throw new Error('Insufficient leave balance');

  return {
    ...balance,
    taken: nextTaken,
    pending: nextPending,
    closing: nextClosing,
  };
}

