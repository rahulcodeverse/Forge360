export interface LeaveBalance {
  opening: number;
  accrued: number;
  taken: number;
  pending: number;
  closing: number;
  carryForwardLimit?: number;
  accrualAmount?: number;
}

export interface WorkflowLevel {
  approverType: 'direct_manager' | 'skip_manager' | 'hr' | 'specific_role' | 'specific_user';
  slaHours: number;
  escalateTo?: string;
  canDelegate: boolean;
  approverId?: string;
  roleCode?: string;
}

export interface WorkflowConfig {
  moduleType: string;
  levels: WorkflowLevel[];
  parallelLevels?: boolean;
  autoApproveRules?: Array<{ condition: string }>;
}

export interface PayrollComponent {
  code: string;
  type: 'earning' | 'deduction' | 'statutory';
  amount: number;
  taxable?: boolean;
}

export interface PayrollEmployee {
  id: string;
  country: string;
  annualCtc: number;
  paidDays: number;
  workingDays: number;
  lopDays: number;
  components: PayrollComponent[];
}

export function calculateLeaveDuration(input: { fromDate: string; toDate: string; nonWorkingDates?: string[] }): number;
export function accrueLeave(balance: LeaveBalance & { accrualAmount: number }): LeaveBalance;
export function applyLeaveApproval(balance: LeaveBalance, decision: { durationDays: number; status: 'approved' | 'rejected' }): LeaveBalance;
export function routeApproval(input: { config: WorkflowConfig; requester: { id: string; managerId?: string; skipManagerId?: string }; hrUserId: string }): {
  status: string;
  currentLevel: number;
  approverId: string | null;
  history: unknown[];
};
export function decideApproval(input: {
  request: { status: string; currentLevel: number; history: unknown[] };
  config: WorkflowConfig;
  actorId: string;
  decision: 'approved' | 'rejected';
  comment?: string;
  requester: { id: string; managerId?: string; skipManagerId?: string };
  hrUserId: string;
}): {
  status: string;
  currentLevel: number;
  approverId: string | null;
  history: unknown[];
};
export function appendAuditEvent(input: {
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeValue?: unknown;
  afterValue?: unknown;
  ip?: string;
}): {
  id: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeValue: unknown;
  afterValue: unknown;
  ip?: string;
  createdAt: string;
  immutable: true;
};
export function runPayroll(input: { month: number; year: number; employees: PayrollEmployee[] }): {
  month: number;
  year: number;
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  items: Array<{
    employeeId: string;
    country: string;
    gross: number;
    deductions: number;
    net: number;
    lopDays: number;
    components: PayrollComponent[];
  }>;
};
export const indiaPayrollPlugin: unknown;
export const usPayrollPlugin: unknown;
export const ukPayrollPlugin: unknown;
export const uaePayrollPlugin: unknown;
export function createPasswordHash(password: string): string;
export function verifyPassword(password: string, storedHash: string): boolean;
export function hashToken(token: string): string;
export function canAttemptLogin(account: { failedAttempts: number; lockedUntil?: string | null }, now?: Date): boolean;
export function registerFailedLogin(account: { failedAttempts: number; lockedUntil?: string | null }, now?: Date): {
  failedAttempts: number;
  lockedUntil: string | null;
};
export function registerSuccessfulLogin(): {
  failedAttempts: number;
  lockedUntil: null;
};
export function hasPermission(actor: { permissions: string[] }, permission: string): boolean;
export function canAccessEmployeeRecord(
  actor: { id: string; employeeId?: string; directReportIds: string[]; permissions: string[] },
  resource: { employeeId: string },
): boolean;
export function revokeSession(session: { id: string; revokedAt?: string | null }, now?: Date): {
  id: string;
  revokedAt: string;
};
