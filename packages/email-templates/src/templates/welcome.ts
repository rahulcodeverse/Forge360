export function welcomeTemplate(ctx: { employeeName: string; loginUrl: string; temporaryPassword: string }): string {
  return `
<mjml>
  <mj-body background-color="#f9fafb">
    <mj-section background-color="#ffffff" border-radius="12px" padding="32px">
      <mj-column>
        <mj-text font-size="20px" font-weight="600">Welcome to HRMS, ${ctx.employeeName}!</mj-text>
        <mj-text>Your account has been created. Use the following credentials to log in:</mj-text>
        <mj-text><strong>Portal:</strong> <a href="${ctx.loginUrl}">${ctx.loginUrl}</a></mj-text>
        <mj-text><strong>Temporary Password:</strong> ${ctx.temporaryPassword}</mj-text>
        <mj-text>Please change your password after your first login.</mj-text>
        <mj-button background-color="#2563eb" color="#ffffff" border-radius="8px" href="${ctx.loginUrl}">
          Get Started
        </mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
}
