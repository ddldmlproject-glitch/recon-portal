import { Routes } from '@angular/router';
import { DqCodeManagementComponent } from './features/dq-code-management/dq-code-management.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dq-code-management' },
  { path: 'dq-code-management', component: DqCodeManagementComponent },
  { path: '**', redirectTo: 'dq-code-management' }
];
