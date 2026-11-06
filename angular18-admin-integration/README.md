# ReghubOps Admin — Angular 18 integration bundle

This folder documents how to copy the complete Admin feature set from the existing standalone source project into an existing Angular 18 standalone application.

## Source of truth

The complete Admin implementation remains in:
`grouping-approvals-standalone/src/app/`

It contains:
- Grouping and Orchestration in `features/grouping-approvals/`
- Inbox in `features/inbox/`
- Create Screen and custom screen rendering in the Grouping/Admin shell
- Shared configuration, API client and engine services in `core/`
- Dynamic form, grid and screen components in `shared/components/`

## Copy into an existing Angular 18 app

From the repository root, run the PowerShell script:

```powershell
.\angular18-admin-integration\copy-admin-to-existing-angular.ps1 -TargetProject "C:\path\to\your\angular18-project"
```

The script copies only the Admin source folders into the target project's `src/app`. It does not overwrite the target's `package.json`, `angular.json`, `app.component.*`, `app.config.ts`, `app.routes.ts`, or global styles.

If the target already has `src/app/core`, `features`, or `shared`, inspect the merge preview first and back up the target before running. Existing files with the same relative path are not overwritten by the script; they are reported for manual comparison.

## Wire the Admin route

In the target app's `app.routes.ts`, add:

```ts
import { GroupingApprovalsComponent } from './features/grouping-approvals/grouping-approvals.component';

export const routes: Routes = [
  // Keep your existing routes.
  { path: 'admin', component: GroupingApprovalsComponent }
];
```

Use the actual relative import path based on where you copy the folders.

## Register required providers

Merge these providers into the existing `app.config.ts`; do not replace the existing provider array:

```ts
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { API_ENVIRONMENT } from './core/api/api-environment.token';
import { API_ENVIRONMENT_CONFIG } from './core/config/api-environment.config';
import { GROUPING_APPROVALS_REPOSITORY } from './features/grouping-approvals/grouping-approvals.repository';
import { GroupingApprovalsMockRepository } from './features/grouping-approvals/grouping-approvals.mock.repository';

// Add to the existing providers array:
provideHttpClient(),
provideAnimations(),
{ provide: API_ENVIRONMENT, useValue: API_ENVIRONMENT_CONFIG },
{ provide: GROUPING_APPROVALS_REPOSITORY, useClass: GroupingApprovalsMockRepository }
```

If the target already provides HTTP or animations, do not register them twice unnecessarily. The mock repository is suitable for the demo. For production, configure the API repository and backend URL instead.

## AG Grid

The source project uses AG Grid. Check the target project's installed versions before installing anything. The source project's package manifest is the version reference; do not replace the target app's package manifest. Install compatible `ag-grid-angular` and `ag-grid-community` versions if they are missing.

If using AG Grid v33+, register the required modules once during application bootstrap, following the source app's `app.config.ts` pattern.

## Angular 18 compatibility

The source app uses Angular standalone components and signals. Before merging into an Angular 18 project:
1. Keep the target app's Angular 18 dependency versions.
2. Compare the source and target AG Grid versions.
3. Run the target app's TypeScript build and resolve any version-specific API differences.
4. Keep existing target routes, providers, global styles and bootstrap configuration.
5. Check the Inbox demo selector and replace it with the target app's authenticated SOEID before production use.

## Demo limitations

Grouping and Orchestration currently use the mock repository. Inbox records and approval decisions are in-memory demo data. Create Screen definitions and records are stored in browser localStorage. Backend persistence and production authentication must be connected separately.

## Verify

```powershell
npm install
npx ng build
```

Run these commands from the target project root. A successful build has not been asserted by this integration guide; validate in the target project's environment.
