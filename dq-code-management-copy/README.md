# DQ Code Management — runnable Angular demo and copy-ready feature

This folder is now a **standalone Angular 18 demo workspace** as well as the source bundle you can copy into another Angular application. You can run it directly without using the repository root or the Grouping Approvals application.

## Run the DQ screen locally (macOS)

### 1. Open the feature folder

From your existing repository clone:

```bash
cd /Users/kasthuriadusumalli/Git/recon-portal/dq-code-management-copy
```

Or clone the feature branch first:

```bash
cd /Users/kasthuriadusumalli/Git
git clone --branch feature/dq-code-management https://github.com/ddldmlproject-glitch/recon-portal.git
cd recon-portal/dq-code-management-copy
```

### 2. Confirm this is the Angular workspace

```bash
ls package.json angular.json
```

Both files should be present in `dq-code-management-copy`. Do not run npm commands from the `recon-portal` repository root.

### 3. Install dependencies

```bash
npm install
```

The demo uses Angular 18.2.8 and AG Grid Angular / Community / Enterprise `~35.3.1`. If your corporate npm registry does not provide one of these versions, check registry access and package availability before changing versions.

### 4. Start the demo

```bash
npm start
```

Open **http://localhost:4200/dq-code-management**. The root URL redirects to the DQ screen.

### 5. Build check (optional)

In a second terminal, from this same `dq-code-management-copy` directory:

```bash
npm run build
```

## Test the screen

1. Confirm the grid loads sample rows with the default **Unmapped** filter.
2. Change Mapping Status to **Mapped**, **Unmapped**, and **GenAI**. The sample dataset now includes pending GenAI records from initial load; select **GenAI** to see them.
3. Use the right-side **Columns** panel to show/hide and reorder columns; switch to **Filters** to manage column filters. Use floating filters below column headers as well.
4. On an Unmapped row, click **ACT**. The demo changes its status to **GENAI** and fills suggested mapping values and Satisfaction Score.
5. Select **GenAI** and confirm the Satisfaction Score and Approve / Reject actions appear.
6. Click a row to open the record details panel.
7. Click **Approve**, enter a comment, and select **Send Comment**.
8. Repeat using **Reject** and a comment.
9. Scroll down to test the infinite-row-model paging behavior.
10. Refresh the browser. Mock changes reset because the data is held in memory only.

## Feature behavior

- Configuration-driven page filters and AG Grid columns.
- Mapped / Unmapped / GenAI status filtering.
- Infinite scrolling over a mock in-memory dataset.
- Right-side AG Grid Columns and Filters tool panels, with the Columns panel open by default. Users can show/hide and reorder columns, and use the Filters panel to manage column filters.
- Sortable, resizable columns, floating filters, column-level filtering, and CSV export.
- ACT generates deterministic sample GenAI mapping values and changes the status to GENAI.
- GENAI rows show Satisfaction Score and Approve / Reject actions.
- Approve / Reject opens a comment dialog and stores the decision/comment in memory.
- Clicking a row opens its details panel.

## Folder structure

```text
dq-code-management-copy/
  package.json
  angular.json
  tsconfig.json
  src/
    main.ts
    index.html
    styles.scss
    app/
      app.component.ts
      app.routes.ts
      features/dq-code-management/
  config/
    dq-code-page.config.json
    dq-code-grid.config.json
```

## Copy into the Citi MFE later

The feature source is:

```text
src/app/features/dq-code-management
```

Copy that folder into the host application's `src/app/features/`, then add a route:

```ts
{
  path: 'dq-code-management',
  loadComponent: () =>
    import('./features/dq-code-management/dq-code-management.component')
      .then(m => m.DqCodeManagementComponent)
}
```

Register AG Grid modules once in the host bootstrap:

```ts
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);
```

Align AG Grid package versions and APIs with the host application's approved dependencies. Do not install a second conflicting AG Grid version in the host.

## Backend/configuration notes

- No backend API is connected. `DqCodeManagementMockService` creates sample records and simulates paging, GenAI suggestions, and review decisions.
- ACT does not call a real GenAI model.
- Comments and decisions are not persisted; refreshing resets demo changes.
- The JSON examples in `config/` are declarative backend-ready page/grid configuration examples. The TypeScript config is used as the demo fallback.
- A production paging API should accept `startRow`, `endRow`, and `mappingStatus`, and return rows plus `lastRow`.
- A backend should persist generated values, status `GENAI`, satisfaction score, reviewer decision, and comment.
