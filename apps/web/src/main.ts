import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './shell/app.component';
import { routes } from './shell/routes';

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes)],
}).catch((error) => console.error(error));

