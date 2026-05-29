export interface LeaveApprovalContext {
  employeeName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  durationDays: number;
  decision: 'approved' | 'rejected';
  approverName: string;
  comment?: string;
  portalUrl: string;
}

export function leaveApprovalTemplate(ctx: LeaveApprovalContext): string {
  const isApproved = ctx.decision === 'approved';
  const color = isApproved ? '#16a34a' : '#dc2626';
  const statusText = isApproved ? 'Approved' : 'Rejected';

  return `
<mjml>
  <mj-head>
    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" />
    <mj-attributes>
      <mj-all font-family="Inter, sans-serif" />
      <mj-text font-size="14px" color="#374151" line-height="1.6" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f9fafb">
    <mj-section padding="20px 0">
      <mj-column>
        <mj-text font-size="24px" font-weight="600" color="#111827" align="center">HRMS</mj-text>
      </mj-column>
    </mj-section>

    <mj-section background-color="#ffffff" border-radius="12px" padding="32px">
      <mj-column>
        <mj-text font-size="20px" font-weight="600" color="#111827">
          Leave Request ${statusText}
        </mj-text>
        <mj-divider border-color="#e5e7eb" padding="16px 0" />

        <mj-text>Hi ${ctx.employeeName},</mj-text>
        <mj-text>
          Your <strong>${ctx.leaveType}</strong> request from
          <strong>${ctx.fromDate}</strong> to <strong>${ctx.toDate}</strong>
          (${ctx.durationDays} day${ctx.durationDays !== 1 ? 's' : ''}) has been
          <strong style="color: ${color}">${statusText.toLowerCase()}</strong>
          by ${ctx.approverName}.
        </mj-text>

        ${ctx.comment ? `<mj-text><strong>Comment:</strong> "${ctx.comment}"</mj-text>` : ''}

        <mj-button background-color="#2563eb" color="#ffffff" border-radius="8px" href="${ctx.portalUrl}/leave">
          View Leave Details
        </mj-button>
      </mj-column>
    </mj-section>

    <mj-section padding="16px 0">
      <mj-column>
        <mj-text align="center" font-size="12px" color="#9ca3af">
          This is an automated email from your HRMS. Please do not reply.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
}
