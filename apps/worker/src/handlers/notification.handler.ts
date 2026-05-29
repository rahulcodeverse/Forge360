import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import mjml2html from 'mjml';
import { PrismaClient } from '@prisma/client';

import {
  leaveApprovalTemplate,
  payslipGeneratedTemplate,
  passwordResetTemplate,
  welcomeTemplate,
} from '@hrms/email-templates';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: process.env['SMTP_HOST'] ?? 'localhost',
  port: parseInt(process.env['SMTP_PORT'] ?? '1025', 10),
  auth: process.env['SMTP_USER']
    ? { user: process.env['SMTP_USER'], pass: process.env['SMTP_PASS'] }
    : undefined,
});

const FROM = process.env['EMAIL_FROM'] ?? 'noreply@hrms.local';

async function sendMjml(to: string, subject: string, mjmlContent: string): Promise<void> {
  const { html, errors } = mjml2html(mjmlContent, { minify: true });
  if (errors.length > 0) {
    console.warn('MJML template warnings:', errors);
  }
  await transporter.sendMail({ from: FROM, to, subject, html });
}

export async function handleNotificationJob(job: Job): Promise<void> {
  const { notificationId } = job.data as { notificationId: string };

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    include: {
      employee: {
        select: { workEmail: true, firstName: true, lastName: true },
      },
    },
  });

  if (!notification || !notification.employee) return;

  const employeeEmail = notification.employee.workEmail;
  const employeeName = `${notification.employee.firstName} ${notification.employee.lastName}`;
  const portalUrl = process.env['PORTAL_URL'] ?? 'http://localhost:3000';

  switch (job.name) {
    case 'send-email': {
      switch (notification.type) {
        case 'leave.approved':
        case 'leave.rejected': {
          const mjml = leaveApprovalTemplate({
            employeeName,
            leaveType: 'Leave',
            fromDate: '',
            toDate: '',
            durationDays: 0,
            decision: notification.type === 'leave.approved' ? 'approved' : 'rejected',
            approverName: 'Your Manager',
            portalUrl,
          });
          await sendMjml(employeeEmail, notification.title, mjml);
          break;
        }

        case 'payslip.generated': {
          const mjml = payslipGeneratedTemplate({
            employeeName,
            month: 'Current',
            year: new Date().getFullYear(),
            netPay: '0',
            currency: 'INR',
            payslipUrl: portalUrl,
            portalUrl,
          });
          await sendMjml(employeeEmail, notification.title, mjml);
          break;
        }

        case 'password.reset': {
          const mjml = passwordResetTemplate({
            userName: employeeName,
            resetUrl: `${portalUrl}/reset-password`,
            expiresIn: '24 hours',
          });
          await sendMjml(employeeEmail, 'Reset your HRMS password', mjml);
          break;
        }

        default:
          await transporter.sendMail({
            from: FROM,
            to: employeeEmail,
            subject: notification.title,
            text: notification.body,
          });
      }
      break;
    }

    case 'send-sms': {
      console.log(`SMS to ${employeeEmail}: ${notification.body}`);
      break;
    }
  }
}
