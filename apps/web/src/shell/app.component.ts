import { Component, computed, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'forge360-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <main class="app-shell" [class.dark]="darkMode()">
      <aside class="sidebar">
        <h1>Forge360</h1>
        <p>Building Better Workplaces</p>
        <button type="button" (click)="toggleTheme()">{{ themeLabel() }}</button>
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

  toggleTheme() {
    this.darkMode.update((value) => !value);
  }
}

