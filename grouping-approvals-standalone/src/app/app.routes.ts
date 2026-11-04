import { Routes } from '@angular/router';
import { GroupingApprovalsComponent } from './features/grouping-approvals/grouping-approvals.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'grouping-approvals' },
  { path: 'grouping-approvals', component: GroupingApprovalsComponent },
  { path: '**', redirectTo: 'grouping-approvals' }
];