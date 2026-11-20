import { ModuleRegistry, AllCommunityModule, SideBarModule } from 'ag-grid-community';
import { ColumnsToolPanelModule, FiltersToolPanelModule } from 'ag-grid-enterprise';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

ModuleRegistry.registerModules([
  AllCommunityModule,
  SideBarModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule
]);

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes)]
}).catch(error => console.error(error));
