import { LeavePageClient } from '@/components/leave/leave-page-client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Leave Management' };

export default function LeavePage() {
  return <LeavePageClient />;
}
