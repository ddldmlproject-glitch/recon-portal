import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

ModuleRegistry.registerModules([AllCommunityModule]);

bootstrapApplication(AppComponent, {
  providers: [provideAnimations(), provideRouter(routes)]
}).catch(error => console.error(error));
