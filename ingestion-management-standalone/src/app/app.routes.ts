import { Routes } from '@angular/router';
import { IngestionDashboardComponent } from './features/ingestion/components/ingestion-dashboard.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'ingestion' },
  { path: 'ingestion', component: IngestionDashboardComponent },
  { path: '**', redirectTo: 'ingestion' }
];
