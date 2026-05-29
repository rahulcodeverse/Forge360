'use client';

import { Calendar, CreditCard, FileText, PlusCircle, Target } from 'lucide-react';
import Link from 'next/link';

const actions = [
  { label: 'Apply Leave', href: '/leave/apply', icon: Calendar, color: 'text-blue-600 bg-blue-50' },
  {
    label: 'View Payslip',
    href: '/payroll/payslips',
    icon: CreditCard,
    color: 'text-green-600 bg-green-50',
  },
  {
    label: 'Submit Goals',
    href: '/performance/goals',
    icon: Target,
    color: 'text-purple-600 bg-purple-50',
  },
  {
    label: 'Submit Expense',
    href: '/expenses/new',
    icon: PlusCircle,
    color: 'text-orange-600 bg-orange-50',
  },
  {
    label: 'My Documents',
    href: '/profile/documents',
    icon: FileText,
    color: 'text-gray-600 bg-gray-50',
  },
];

export function QuickActionsWidget() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 gap-2">
        {actions.map(({ label, href, icon: Icon, color }) => (
          <Link
            key={label}
            href={`/en-US${href}`}
            className="flex items-center gap-3 rounded-md p-2.5 hover:bg-muted transition-colors"
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-md ${color}`}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
