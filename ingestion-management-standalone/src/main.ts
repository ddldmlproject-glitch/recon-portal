import { provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AppComponent } from './app/app.component';

ModuleRegistry.registerModules([AllCommunityModule]);

bootstrapApplication(AppComponent, {
  providers: [provideZoneChangeDetection({ eventCoalescing: true })]
}).catch(error => console.error(error));
