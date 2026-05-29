import { Component } from '@angular/core';

const metrics = [
  { label: 'Headcount', value: '24,850', detail: '+6.2% this quarter' },
  { label: 'Attrition', value: '8.4%', detail: '1.8 pts lower' },
  { label: 'Payroll Cost', value: '$18.4M', detail: 'Across 12 entities' },
  { label: 'Engagement', value: '82', detail: 'Pulse score' },
];

const lifecycle = ['Recruit', 'Onboard', 'Manage', 'Pay', 'Grow', 'Engage', 'Exit'];

const modules = [
  { title: 'Core HR', area: 'Employee profiles, documents, skills, banking, family, custom fields' },
  { title: 'Organization', area: 'Companies, departments, cost centers, reporting hierarchy, org chart' },
  { title: 'Recruitment ATS', area: 'Career portal, candidate pipeline, interviews, offers, referrals' },
  { title: 'Attendance', area: 'Web, mobile, GPS, geofencing, face recognition, biometric integrations' },
  { title: 'Leave and Shift', area: 'Dynamic leave types, balances, fixed, flexible, rotational, night shifts' },
  { title: 'Payroll Engine', area: 'Earnings, deductions, taxes, benefits, formulas, slabs, effective dates' },
  { title: 'Compliance Engine', area: 'Configurable statutory rules, filings, forms, reports, audit evidence' },
  { title: 'Workflow Builder', area: 'No-code approvals, conditions, escalation, SLA, task automation' },
  { title: 'Performance', area: 'KPI, OKR, goals, 360 review, calibration, promotions, appraisal cycles' },
  { title: 'Learning', area: 'Courses, assessments, certifications, learning paths, AI recommendations' },
  { title: 'Helpdesk', area: 'HR, payroll, IT tickets, assignment, SLA, escalation, knowledge base' },
  { title: 'Forge360 AI', area: 'HR copilot, resume ranking, attrition prediction, OCR, document extraction' },
];

const policies = [
  'Leave policies',
  'Attendance policies',
  'Payroll policies',
  'Tax policies',
  'Overtime rules',
  'Holiday calendars',
];

@Component({
  selector: 'forge360-workforce-dashboard',
  standalone: true,
  template: `
    <header class="page-header">
      <div>
        <h2>Workforce Command Center</h2>
        <p>Unified lifecycle operations across people, payroll, compliance, workflows, AI, and analytics.</p>
      </div>
      <div class="actions">
        <button type="button" class="secondary">Import Employees</button>
        <button type="button">Create Workflow</button>
      </div>
    </header>

    <section class="metrics" aria-label="Workforce metrics">
      @for (metric of metrics; track metric.label) {
        <article>
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small>{{ metric.detail }}</small>
        </article>
      }
    </section>

    <section class="lifecycle" aria-label="Employee lifecycle">
      @for (stage of lifecycle; track stage) {
        <div>
          <span>{{ stage }}</span>
        </div>
      }
    </section>

    <section class="split">
      <article class="panel">
        <h3>Global Compliance Engine</h3>
        <p>Statutory behavior is configured through rule definitions, formulas, slabs, effective dates, and filing templates.</p>
        <div class="rule-list">
          @for (policy of policies; track policy) {
            <span>{{ policy }}</span>
          }
        </div>
      </article>

      <article class="panel">
        <h3>Forge360 AI</h3>
        <p>Copilots and prediction models operate inside tenant, legal entity, and employee-permissioned data boundaries.</p>
        <div class="ai-grid">
          <span>HR Copilot</span>
          <span>AI Recruitment</span>
          <span>AI Analytics</span>
          <span>Document Intelligence</span>
        </div>
      </article>
    </section>

    <section class="module-grid" aria-label="Forge360 product modules">
      @for (module of modules; track module) {
        <article class="module-card">
          <strong>{{ module.title }}</strong>
          <p>{{ module.area }}</p>
          <span>Configurable</span>
        </article>
      }
    </section>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
        margin-bottom: 24px;
      }

      h2 {
        margin: 0 0 6px;
        font-size: 30px;
      }

      p {
        margin: 0;
        color: #5b6472;
      }

      .actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .metrics {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 18px;
      }

      .metrics article,
      .panel,
      .module-card {
        border: 1px solid rgba(17, 24, 39, 0.12);
        border-radius: 8px;
        background: #fff;
      }

      .metrics article {
        padding: 16px;
        display: grid;
        gap: 8px;
      }

      .metrics span,
      .metrics small {
        color: #5b6472;
      }

      .metrics strong {
        font-size: 28px;
      }

      .lifecycle {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 8px;
        margin-bottom: 18px;
      }

      .lifecycle div {
        min-height: 48px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        background: #123c3a;
        color: #fff;
        font-weight: 700;
      }

      .split {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 18px;
      }

      .panel {
        padding: 18px;
      }

      .panel h3 {
        margin: 0 0 8px;
        font-size: 18px;
      }

      .rule-list,
      .ai-grid {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 16px;
      }

      .rule-list span,
      .ai-grid span {
        border: 1px solid rgba(15, 118, 110, 0.22);
        border-radius: 6px;
        padding: 7px 9px;
        color: #0f766e;
        background: rgba(15, 118, 110, 0.08);
      }

      .module-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 12px;
      }

      .module-card {
        padding: 16px;
        min-height: 150px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .module-card p {
        margin: 10px 0 16px;
        line-height: 1.45;
      }

      .module-card span {
        color: #0f766e;
        font-size: 13px;
      }

      button {
        min-height: 36px;
        padding: 0 14px;
        border-radius: 6px;
        border: 0;
        background: #0f766e;
        color: #fff;
      }

      .secondary {
        background: #fff;
        color: #0f766e;
        border: 1px solid rgba(15, 118, 110, 0.35);
      }

      @media (max-width: 980px) {
        .metrics,
        .split {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .lifecycle {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
      }

      @media (max-width: 680px) {
        .page-header,
        .actions {
          display: grid;
          justify-content: stretch;
        }

        .metrics,
        .split,
        .lifecycle {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class WorkforceDashboardComponent {
  readonly metrics = metrics;
  readonly lifecycle = lifecycle;
  readonly modules = modules;
  readonly policies = policies;
}
