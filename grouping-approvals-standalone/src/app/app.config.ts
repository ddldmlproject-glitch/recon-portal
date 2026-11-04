import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { API_ENVIRONMENT } from './core/api/api-environment.token';
import { API_ENVIRONMENT_CONFIG } from './core/config/api-environment.config';
import { routes } from './app.routes';
import { GROUPING_APPROVALS_REPOSITORY } from './features/grouping-approvals/grouping-approvals.repository';
import { GroupingApprovalsMockRepository } from './features/grouping-approvals/grouping-approvals.mock.repository';

ModuleRegistry.registerModules([AllCommunityModule]);

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideHttpClient(),
    provideRouter(routes),
    { provide: API_ENVIRONMENT, useValue: API_ENVIRONMENT_CONFIG },
    // Switch to GroupingApprovalsApiRepository when the microservice contract is available.
    { provide: GROUPING_APPROVALS_REPOSITORY, useClass: GroupingApprovalsMockRepository }
  ]
};
