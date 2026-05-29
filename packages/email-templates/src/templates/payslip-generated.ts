export interface PayslipGeneratedContext {
  employeeName: string;
  month: string;
  year: number;
  netPay: string;
  currency: string;
  payslipUrl: string;
  portalUrl: string;
}

export function payslipGeneratedTemplate(ctx: PayslipGeneratedContext): string {
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
        <mj-text font-size="20px" font-weight="600">Your ${ctx.month} ${ctx.year} Payslip</mj-text>
        <mj-divider border-color="#e5e7eb" padding="16px 0" />
        <mj-text>Hi ${ctx.employeeName},</mj-text>
        <mj-text>
          Your payslip for <strong>${ctx.month} ${ctx.year}</strong> is now available.
          Net pay: <strong>${ctx.currency} ${ctx.netPay}</strong>.
        </mj-text>
        <mj-button background-color="#2563eb" color="#ffffff" border-radius="8px" href="${ctx.payslipUrl}">
          Download Payslip PDF
        </mj-button>
        <mj-text font-size="12px" color="#6b7280" padding-top="16px">
          You can also view all payslips at <a href="${ctx.portalUrl}/payroll">${ctx.portalUrl}/payroll</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
}
