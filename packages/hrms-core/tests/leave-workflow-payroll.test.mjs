import assert from 'node:assert/strict';
import test from 'node:test';
import { appendAuditEvent, applyLeaveApproval, decideApproval, routeApproval, runPayroll } from '../src/index.mjs';

test('leave approval deducts balance and writes an audit-ready event', () => {
  const previous = { opening: 12, accrued: 2, taken: 1, pending: 2, closing: 11 };
  const next = applyLeaveApproval(previous, { durationDays: 2, status: 'approved' });
  assert.equal(next.taken, 3);
  assert.equal(next.pending, 0);
  assert.equal(next.closing, 11);

  const audit = appendAuditEvent({
    actorId: 'manager-1',
    action: 'leave.approved',
    resourceType: 'leave_request',
    resourceId: 'leave-1',
    beforeValue: previous,
    afterValue: next,
  });
  assert.equal(audit.immutable, true);
  assert.equal(audit.action, 'leave.approved');
});

test('workflow routes direct manager then HR approval', () => {
  const config = {
    moduleType: 'leave',
    levels: [
      { approverType: 'direct_manager', slaHours: 24, canDelegate: true },
      { approverType: 'hr', slaHours: 24, canDelegate: true },
    ],
  };
  const requester = { id: 'emp-1', managerId: 'mgr-1' };
  const request = routeApproval({ config, requester, hrUserId: 'hr-1' });
  assert.equal(request.approverId, 'mgr-1');
  const afterManager = decideApproval({ request, config, actorId: 'mgr-1', decision: 'approved', requester, hrUserId: 'hr-1' });
  assert.equal(afterManager.approverId, 'hr-1');
  const afterHr = decideApproval({ request: afterManager, config, actorId: 'hr-1', decision: 'approved', requester, hrUserId: 'hr-1' });
  assert.equal(afterHr.status, 'approved');
});

test('loss of pay days reduce payroll and statutory deductions are country plugins', () => {
  const payroll = runPayroll({
    month: 5,
    year: 2026,
    employees: [
      {
        id: 'emp-in',
        country: 'IN',
        annualCtc: 1200000,
        workingDays: 30,
        paidDays: 28,
        lopDays: 2,
        components: [
          { code: 'BASIC', type: 'earning', amount: 50000, taxable: true },
          { code: 'HRA', type: 'earning', amount: 20000, taxable: true },
        ],
      },
    ],
  });

  assert.equal(payroll.employeeCount, 1);
  assert.equal(payroll.items[0].gross, 65333.33);
  assert.equal(payroll.items[0].components.some((component) => component.code === 'PF_EMPLOYEE'), true);
  assert.equal(payroll.totalNet < payroll.totalGross, true);
});

