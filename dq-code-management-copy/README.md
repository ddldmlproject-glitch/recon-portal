# Data Quality Code Management — copy-ready Angular feature

This folder is an isolated feature bundle for the Citi MFE. It does not modify or import the existing Grouping, Inbox, or Orchestration screens.

## Feature behavior
- Configuration-driven page, filters and AG Grid columns.
- Mapped / Unmapped status filtering.
- Infinite scrolling using AG Grid's Infinite Row Model (server-side paging contract; in this demo the datasource pages an in-memory sample set).
- Unmapped rows expose **ACT**. ACT runs a deterministic mock GenAI generator and changes the row status to **GENAI** while populating suggested mapping values and a satisfaction score.
- GENAI rows expose **Satisfaction Score** and **Action** columns with Approve / Reject.
- Approve / Reject opens a comment dialog. The Send Comment action stores the comment and decision in the in-memory demo repository.
- Clicking a row opens its details panel. Clicking an action button does not trigger the row click.

## Compatibility
- Written as standalone Angular components/services. No module federation, app shell, global route edits, or changes to existing screens.
- Uses the unscoped AG Grid packages: `ag-grid-angular`, `ag-grid-community`, and `ag-grid-enterprise`.
- Intended consumer dependency versions: `~35.3.1` for all three packages. The consuming MFE should provide these dependencies and register the required AG Grid modules once at application bootstrap.

## Copy into the Citi MFE
Copy `src/app/features/dq-code-management` into the same path in the MFE. Add the route shown below to the host route configuration, or mount the component from the host's existing page configuration/router.

```ts
{
  path: 'dq-code-management',
  loadComponent: () =>
    import('./features/dq-code-management/dq-code-management.component')
      .then(m => m.DqCodeManagementComponent)
}
```

Register AG Grid modules once in the host application (if not already registered):

```ts
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { InfiniteRowModelModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllCommunityModule, InfiniteRowModelModule]);
```

Ensure the host has AG Grid theme CSS loaded. This feature uses the Quartz theme class and does not import or overwrite global styles.

## Configuration for backend
The backend-ready JSON examples are in `config/dq-code-page.config.json` and `config/dq-code-grid.config.json`. They contain declarative values only (no functions or Angular code), so they can be stored as page/grid configuration documents. The component maps configured field keys to local AG Grid renderers and action handlers.

The TypeScript defaults in `src/app/features/dq-code-management/config/` are demo fallbacks. Replace them with the backend configuration response when the page-config endpoint is available.

## Demo data
No API is currently available. `DqCodeManagementMockService` supplies sample rows and simulates paging, GenAI suggestions, and review decisions in memory. Refreshing the app resets demo changes. Replace this service with an API-backed implementation later; keep the same method contract.

## Notes
- The mock ACT operation does not call a real GenAI model and does not persist to a database.
- Infinite scrolling demonstrates the paged API contract using sample data. A production API should accept `startRow`, `endRow`, and `mappingStatus` and return `rows` plus `lastRow`.
- The backend should persist generated mapping values, status `GENAI`, satisfaction score, reviewer decision and comment atomically.
