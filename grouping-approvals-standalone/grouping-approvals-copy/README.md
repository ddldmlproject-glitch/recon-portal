# Grouping Approvals — copy-ready Angular feature

This folder is a self-contained **Grouping Approvals** feature bundle for an existing Angular standalone application.

## Included
- Grouping list with search and CSV export
- Create and edit entitlement groups
- Delete groups with confirmation
- Configurable group form and AG Grid rendering
- Repository abstraction with demo mock data
- Supporting screen configuration and reusable dynamic form/grid components

## Not included
- Create Screen / user-created screen builder
- Inbox
- Orchestration

## Copy into an existing Angular standalone project

From this folder, run PowerShell:

```powershell
.\copy-grouping-approvals.ps1 -TargetProject "C:\path\to\your\angular-project"
```

Preview without copying:

```powershell
.\copy-grouping-approvals.ps1 -TargetProject "C:\path\to\your\angular-project" -WhatIf
```

The script copies only the files under this bundle's `src/app` into the target's `src/app`. Existing files are never overwritten; collisions are reported for manual review.

## Route

Add this route to the target's existing route array (keep all existing routes):

```ts
import { GroupingApprovalsComponent } from './features/grouping-approvals/grouping-approvals.component';

{ path: 'grouping-approvals', component: GroupingApprovalsComponent }
```

Adjust the import path if you choose a different destination.

## Providers

Merge these into the target's existing providers array:

```ts
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { GROUPING_APPROVALS_REPOSITORY } from './features/grouping-approvals/grouping-approvals.repository';
import { GroupingApprovalsMockRepository } from './features/grouping-approvals/grouping-approvals.mock.repository';

ModuleRegistry.registerModules([AllCommunityModule]);

// Add only if the target does not already provide them:
provideHttpClient(),
provideAnimations(),
{ provide: GROUPING_APPROVALS_REPOSITORY, useClass: GroupingApprovalsMockRepository }
```

Do not duplicate existing HTTP, animation, router or AG Grid registration providers.

## Dependencies

The feature expects Angular standalone components, Angular Common/Forms, RxJS, and AG Grid. Check the target versions first:

```bash
npm ls @angular/core ag-grid-angular ag-grid-community
```

Install AG Grid only if it is missing, using versions compatible with the target Angular version:

```bash
npm install ag-grid-angular ag-grid-community
```

## Demo data

The included mock repository is in-memory demo data. Changes are not persisted across a page reload. Replace the mock provider with an implementation of `GroupingApprovalsRepository` when connecting a backend.

## Verify

From the target project root:

```bash
npx ng build
```

This bundle has not been validated against every consuming Angular workspace. Build and test it in the target project before merging.
