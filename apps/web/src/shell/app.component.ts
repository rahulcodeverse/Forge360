import { Component, computed, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'forge360-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <main class="app-shell" [class.dark]="darkMode()">
      <aside class="sidebar">
        <div class="brand">
          <span class="mark">F360</span>
          <div>
            <h1>Forge360</h1>
            <p>Building Better Workplaces</p>
          </div>
        </div>

        <nav aria-label="Primary workspace">
          @for (item of navItems; track item) {
            <a href="#">{{ item }}</a>
          }
        </nav>

        <button type="button" class="theme-toggle" (click)="toggleTheme()">{{ themeLabel() }}</button>
      </aside>
      <section class="workspace">
        <router-outlet />
      </section>
    </main>
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly darkMode = signal(false);
  readonly themeLabel = computed(() => (this.darkMode() ? 'Light mode' : 'Dark mode'));
  readonly navItems = [
    'Command Center',
    'People',
    'Talent',
    'Time',
    'Payroll',
    'Compliance',
    'Workflows',
    'Performance',
    'Learning',
    'Analytics',
    'AI Copilot',
    'Marketplace',
  ];

  toggleTheme() {
    this.darkMode.update((value) => !value);
  }
}
