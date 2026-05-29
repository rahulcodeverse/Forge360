import { Component } from '@angular/core';

const modules = [
  'Core HR',
  'Organization',
  'Recruitment',
  'Onboarding',
  'Attendance',
  'Leave',
  'Payroll',
  'Compliance',
  'Workflows',
  'Performance',
  'Learning',
  'Analytics',
  'AI Copilot',
  'Marketplace',
];

@Component({
  selector: 'forge360-workforce-dashboard',
  standalone: true,
  template: `
    <header class="page-header">
      <div>
        <h2>Workforce Command Center</h2>
        <p>Unified lifecycle operations across people, payroll, compliance, AI, and analytics.</p>
      </div>
      <button type="button">Create Workflow</button>
    </header>

    <section class="module-grid" aria-label="Forge360 modules">
      @for (module of modules; track module) {
        <article class="module-card">
          <strong>{{ module }}</strong>
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
        font-size: 28px;
      }

      p {
        margin: 0;
        color: #5b6472;
      }

      .module-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }

      .module-card {
        border: 1px solid rgba(17, 24, 39, 0.12);
        border-radius: 8px;
        padding: 16px;
        background: #fff;
        min-height: 96px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
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
    `,
  ],
})
export class WorkforceDashboardComponent {
  readonly modules = modules;
}

