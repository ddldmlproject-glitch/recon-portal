# ReghubOps Admin — ready-to-copy Angular feature

This package contains the complete three-screen, config-driven Admin feature for an existing Angular standalone application.

## Screens

1. **Groups** — create, edit, delete, search and export entitlement groups.
2. **Inbox** — every group created in Groups appears as a group approval request. Open a request to review its object data and approve or reject it.
3. **Orchestration** — view operational load triggers.

There is no Create Screen or user-created screen builder.

## Structure

```text
src/app/
├── core/
│   ├── config/screen-config.models.ts
│   └── engine/
│       ├── form-engine.service.ts
│       └── screen-registry.service.ts
├── features/
│   ├── grouping-approvals/
│   │   ├── grouping-approvals.component.ts|html|scss
│   │   ├── grouping-approvals.models.ts
│   │   ├── grouping-approvals.repository.ts
│   │   ├── grouping-approvals.mock.repository.ts
│   │   ├── grouping-approvals.config.ts
│   │   └── grouping-approvals.screen-config.ts
│   └── inbox/
│       └── inbox.component.ts|html|scss
└── shared/components/
    ├── dynamic-form/
    ├── dynamic-grid/
    └── dynamic-screen/
```

## Copy to an existing Angular standalone app

Preview the copy:

```powershell
.\copy-admin-feature.ps1 -TargetProject "C:\path\to\your\angular-project" -WhatIf
```

Copy the feature files:

```powershell
.\copy-admin-feature.ps1 -TargetProject "C:\path\to\your\angular-project"
```

The script skips existing files rather than overwriting them. Merge any reported collisions manually.

## Route

Merge into the existing route array:

```ts
import { GroupingApprovalsComponent } from './features/grouping-approvals/grouping-approvals.component';

{ path: 'admin', component: GroupingApprovalsComponent }
```

## Repository provider

Merge into the existing providers array; do not replace the target app.config.ts:

```ts
import { GROUPING_APPROVALS_REPOSITORY } from './features/grouping-approvals/grouping-approvals.repository';
import { GroupingApprovalsMockRepository } from './features/grouping-approvals/grouping-approvals.mock.repository';

{ provide: GROUPING_APPROVALS_REPOSITORY, useClass: GroupingApprovalsMockRepository }
```

The target app must provide Angular Router and Reactive Forms. Register AG Grid Community modules once:

```ts
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);
```

Install AG Grid only if absent, using versions compatible with your Angular version:

```bash
npm install ag-grid-angular ag-grid-community
```

## Object-oriented data and config-driven behavior

Domain classes include `EntitlementGroup`, `GroupApprovalRequest`, `OpsLoadTrigger`, and the generic `ApiResponse<T>` response envelope. The repository interface is the boundary between UI and backend. Keep backend DTO mapping in the repository/API adapter and map incoming JSON into domain objects with the model `fromResponse` factories.

Grid metadata for Groups, Inbox and Orchestration is declared in `grouping-approvals.screen-config.ts`. Form fields are declared in the Grouping component configuration. Shared DynamicForm, DynamicGrid and DynamicScreen components render the metadata.

Creating a group sets its status to Pending. Inbox derives its request list from the same group collection; it does not create a disconnected request record. Approve/reject actions call the repository and update that same group object, so the Groups grid and Inbox stay in sync.

The included mock repository is in-memory demo data. It is not durable across a reload. Replace it with an API-backed repository for shared persistence and production authorization.

## Verify

From the consuming project root:

```bash
npx ng build
```
