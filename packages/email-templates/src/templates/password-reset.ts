export function passwordResetTemplate(ctx: { userName: string; resetUrl: string; expiresIn: string }): string {
  return `
<mjml>
  <mj-body background-color="#f9fafb">
    <mj-section background-color="#ffffff" border-radius="12px" padding="32px">
      <mj-column>
        <mj-text font-size="20px" font-weight="600">Reset your password</mj-text>
        <mj-text>Hi ${ctx.userName}, click the button below to reset your HRMS password. This link expires in ${ctx.expiresIn}.</mj-text>
        <mj-button background-color="#2563eb" color="#ffffff" border-radius="8px" href="${ctx.resetUrl}">
          Reset Password
        </mj-button>
        <mj-text font-size="12px" color="#6b7280">If you didn't request this, ignore this email.</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
}
