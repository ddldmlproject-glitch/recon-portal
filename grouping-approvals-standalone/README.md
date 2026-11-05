# Grouping & Approvals — Angular 21 configuration-driven standalone application

A standalone Angular application demonstrating a metadata-driven UI architecture. Angular owns screen configuration, rendering, forms, validation, navigation and interaction dispatch. Repository adapters isolate the UI from persistence: the local demo uses mock data, while a microservice adapter is provided as an integration starting point.

## 1. Run the application

Requirements: a Node.js version supported by Angular 21 and npm.

```bash
cd grouping-approvals-standalone
npm install
npm start
```

Open http://localhost:4200/grouping-approvals.

To validate compilation:

```bash
npm run build
```

The mock provider is selected by default. Its data is in memory and resets when the browser application is restarted.

## 2. What happens when the Groups screen opens?

The current runtime flow is:

1. `GroupingApprovalsComponent` imports `GROUPING_APPROVALS_SCREENS` from `grouping-approvals.screen-config.ts`.
2. The component registers those definitions using `ScreenRegistryService.registerMany()`.
3. The component retrieves the `groups` and `triggers` definitions from the registry.
4. The template passes the selected `ScreenConfig`, row data and optional feature-specific column overrides to `DynamicScreenComponent`.
5. `DynamicScreenComponent` checks `config.layout`. For `grid`, it passes `config.grid` to `DynamicGridComponent`.
6. `DynamicGridComponent` reads the configured column definitions, page size and row-selection settings and renders AG Grid.
7. The feature component loads records through `GroupingApprovalsRepository`. It does not ask the screen renderer to own persistence.

In short:

```text
GROUPING_APPROVALS_SCREENS
          |
          v
ScreenRegistryService
          |
          v
GroupingApprovalsComponent selects "groups"
          |
          v
DynamicScreenComponent reads layout = "grid"
          |
          v
DynamicGridComponent reads grid.columns / pageSize / selectable
          |
          v
AG Grid renders configured columns + supplied row data
```

The screen renderer is intentionally separate from the repository. Configuration describes the UI; the repository supplies data.

## 3. Where to change the screen

Open:

`src/app/features/grouping-approvals/grouping-approvals.screen-config.ts`

The `GROUPING_APPROVALS_SCREENS` array currently contains two screen definitions:

- `id: 'groups'`: Entitlement Groups.
- `id: 'triggers'`: Recon Load Triggers.

A grid screen definition has this shape:

```typescript
{
  id: 'users',
  title: 'User Management',
  description: 'Manage users',
  layout: 'grid',
  dataSource: {
    resource: 'users',
    operation: 'usersList'
  },
  grid: {
    id: 'users-grid',
    rowId: 'userId',
    pageSize: 20,
    selectable: true,
    quickFilter: true,
    columns: [
      { field: 'userId', headerName: 'User ID', minWidth: 140 },
      { field: 'userName', headerName: 'User Name', minWidth: 180 },
      { field: 'email', headerName: 'Email', minWidth: 220 },
      { field: 'status', headerName: 'Status', minWidth: 110 }
    ]
  },
  actions: [
    { id: 'create-user', label: 'Create User', kind: 'create' }
  ]
}
```

The current feature page uses feature-specific AG Grid column overrides for the Groups row-action renderer. If no override is passed, the dynamic grid uses `config.grid.columns` directly.

To add another screen:
1. Define its model/DTO.
2. Add its `ScreenConfig` to the feature's configuration array.
3. Register the config (the feature currently registers the full array in its constructor).
4. Add a route or navigation entry that selects the screen ID.
5. Implement the feature's data/repository methods.
6. Pass its config and records to `app-dynamic-screen`.

Do not create a new grid component for every feature.

## 4. Configuration types

Open `src/app/core/config/screen-config.models.ts`.

- `ScreenConfig`: screen identity, title, layout, data source, fields, grid, tabs and actions.
- `GridConfig`: row ID, columns, page size and selection behavior.
- `FieldConfig`: field key, label, input type, default, options and validation metadata.
- `ActionConfig`: action ID, label, kind, permission, confirmation and handler ID.
- `FeatureConfig`: a feature grouping of screen definitions.

Supported layout values are currently `grid`, `form` and `master-detail`. The dynamic screen renderer currently has a working grid renderer. Form metadata and the reusable form component are available, while form and master-detail layouts still need to be connected to feature workflows before they are production-ready.

## 5. Dynamic form example

Reusable form renderer:

`src/app/shared/components/dynamic-form/dynamic-form.component.ts`

It accepts a `FieldConfig[]`, uses `FormEngineService` to build an Angular reactive form, renders text/textarea/number/date/select/checkbox/multi-select controls and emits valid values through `submitted`.

Example field configuration:

```typescript
const userFields: FieldConfig[] = [
  {
    key: 'userId',
    label: 'User ID',
    type: 'text',
    required: true,
    validators: [
      { type: 'minLength', value: 3, message: 'Enter at least 3 characters.' }
    ]
  },
  {
    key: 'email',
    label: 'Email',
    type: 'text',
    required: true,
    validators: [
      { type: 'email', message: 'Enter a valid email address.' }
    ]
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    defaultValue: 'Active',
    options: [
      { label: 'Active', value: 'Active' },
      { label: 'Inactive', value: 'Inactive' }
    ]
  }
];
```

Use it inside a standalone component by importing `DynamicFormComponent`:

```html
<app-dynamic-form
  [fields]="userFields"
  [initialValue]="selectedUser"
  (submitted)="saveUser($event)">
</app-dynamic-form>
```

The parent handles the emitted values and calls its repository. The form renderer does not call a microservice directly.

## 6. How to test the current application manually

1. Run `npm install`, then `npm start`.
2. Open `http://localhost:4200/grouping-approvals`.
3. Confirm Entitlement Groups shows four mock records and Recon Load Triggers shows three.
4. Change a grid column's `headerName` in `grouping-approvals.screen-config.ts`, save, and confirm the heading changes after Angular rebuilds.
5. Change a grid column's `minWidth` or add a column definition, save, and confirm the grid reflects it.
6. Change `pageSize` in the grid config and verify the pagination page size.
7. Search for `1001_CHECKER`; verify the displayed rows filter.
8. Open Create Group, enter a unique group name and owner, save, and confirm the new row appears.
9. Edit a group and change its users, roles or tools; save and verify the row remains updated.
10. Switch to Recon Load Triggers and verify the three sample records.
11. Use Export CSV and verify the downloaded file contains the filtered group data.
12. Refresh the browser and note that mock changes reset. This is expected because the mock repository is in-memory.

### A simple configuration experiment

To prove the grid is rendered from config:
1. Open `grouping-approvals.screen-config.ts`.
2. Change the Groups column header from `Group Owner` to `Configured Owner`.
3. Save the file.
4. Wait for the Angular dev server to rebuild.
5. Refresh if the browser does not update automatically.
6. The column heading should now read `Configured Owner` without changing the page HTML.

This test demonstrates config-driven grid rendering.

## 7. Data and microservice integration

The feature depends on `GroupingApprovalsRepository`, not directly on HttpClient.

Current implementations:

- `GroupingApprovalsMockRepository`: local demo records and in-memory create/update.
- `GroupingApprovalsApiRepository`: HttpClient-backed adapter using operation IDs in `API_ENVIRONMENT_CONFIG`.

The application currently selects the mock implementation in `src/app/app.config.ts`:

```typescript
{
  provide: GROUPING_APPROVALS_REPOSITORY,
  useClass: GroupingApprovalsMockRepository
}
```

When the backend contracts are finalized, switch the provider to `GroupingApprovalsApiRepository` and update the API base URL, endpoint paths, request/response DTOs, error mapping and authentication integration. The example `/api` paths are placeholders, not live endpoints.

The API repository currently illustrates list/create/update operations; delete and the complete approval lifecycle still need to be added to the repository contract and UI.

## 8. Important current limitations

This branch is an implementation foundation, not a completed production approvals platform.

- Grid screens are rendered through the dynamic screen and grid components.
- The Create/Edit Group dialog is still feature-specific HTML; it has not yet been migrated to the reusable DynamicFormComponent.
- The reusable dynamic form component exists, but it is not yet the renderer for the Group dialog.
- Action and permission engines exist as foundations; the feature's current buttons are not all dispatched through ActionEngineService.
- User CRUD, role-permission matrix, recon-ID selector, tool/report catalog, delete confirmation, approval state machine and audit history are not complete.
- API URLs and payload contracts must be aligned with the actual microservices.
- UI permission checks do not replace backend authorization.

Before using this as production code, run the build locally, add unit/component tests, connect real service contracts and complete the outstanding workflows.

## 9. Reuse in an existing MFE

This is a separate Angular CLI application. To embed the feature in an MFE, move or package the required `core`, `shared` and feature folders as a library, align Angular/AG Grid versions with the host, and import the standalone feature component into the host route. Use the host authentication, interceptors and design-system theme.


## Group lifecycle and approval demo

The standalone demo now supports:
- Create and edit entitlement groups using the reusable `DynamicFormComponent` and field metadata.
- Required group name/owner validation, select controls, checkbox, text areas and conditional Recon IDs field.
- User IDs, roles and tools/reports assignment as list-based group attributes.
- Recon scope: all recons or a specified list of Recon IDs.
- Delete with a browser confirmation.
- Pending Approvals tab. Pending groups can be approved or rejected; rejection requires a reason.
- CSV export of the currently filtered group list.
- Recon Load Triggers listing.
- Mock repository implementations for create, read, update, delete and approval decisions.

### Test the full demo flow

1. Open Entitlement Groups and click **Create Group**.
2. Enter a unique name and owner. Set Recon Selection to **Specific Recon IDs** and enter values such as `R-10021, R-10022`.
3. Enter approvers, user IDs, roles and tools/reports; choose Pending approval and save.
4. Verify the new record appears in the group grid and Pending Approvals count increases.
5. Open **Pending Approvals**. Use the row's **Approve** action and confirm. The group should move to Active and disappear from the pending list.
6. Create another group and use **Reject**. Enter a rejection reason; the record should move to Rejected.
7. Edit an existing group, change its owner/users/roles/tools/recon scope, save and verify the row updates.
8. Delete a test group and confirm the browser prompt. Verify it disappears from the grid.
9. Search for a group, export CSV, and verify the downloaded file.
10. Refresh the browser. Mock changes reset because the repository is in-memory.

The API repository includes matching delete and decision operations as integration examples. The `/groups/:id/decision` route is a placeholder until your backend team confirms the real service contract.

## CI build check

A GitHub Actions workflow at `.github/workflows/grouping-approvals-standalone-build.yml` installs dependencies and runs `npm run build` for changes to this standalone project. Check the Actions tab for the build result after pushing.
