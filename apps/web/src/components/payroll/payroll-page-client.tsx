'use client';

import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Download, FileText } from 'lucide-react';

import { Skeleton } from '@hrms/ui';

interface PayslipItem {
  id: string;
  gross: number;
  totalDeductions: number;
  netPay: number;
  payslipUrl: string | null;
  run: { month: number; year: number; status: string };
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function PayrollPageClient() {
  const { data, isLoading } = useQuery({
    queryKey: ['payroll', 'payslips', 'mine'],
    queryFn: () => apiClient.get<{ data: PayslipItem[] }>('/payroll/payslips/mine'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Payroll</h1>
        <p className="text-muted-foreground text-sm mt-1">View and download your payslips</p>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="p-5 border-b">
          <h2 className="font-semibold">My Payslips</h2>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : data?.data.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No payslips available yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {data?.data.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium">
                    {MONTH_NAMES[(item.run.month - 1) % 12]} {item.run.year}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Gross: ₹{item.gross.toLocaleString('en-IN')} · Net: ₹
                    {item.netPay.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      item.run.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {item.run.status}
                  </span>
                  {item.payslipUrl && (
                    <a
                      href={item.payslipUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
