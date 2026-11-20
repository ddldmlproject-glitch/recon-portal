import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { InfiniteRowModelModule } from 'ag-grid-enterprise';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

ModuleRegistry.registerModules([AllCommunityModule, InfiniteRowModelModule]);

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes)]
}).catch(error => console.error(error));
