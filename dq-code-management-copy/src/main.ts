import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

// AllCommunityModule includes the Infinite Row Model used by this demo.
ModuleRegistry.registerModules([AllCommunityModule]);

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes)]
}).catch(error => console.error(error));
