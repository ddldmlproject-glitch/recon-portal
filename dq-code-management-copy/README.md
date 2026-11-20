# Data Quality Code Management — copy-ready Angular feature

This folder is an isolated, copy-ready Angular standalone feature for the Citi MFE. It does not modify the existing Grouping, Inbox, or Orchestration screens.

## Feature behavior

- Configuration-driven page, filters, and AG Grid columns.
- Mapped / Unmapped / GenAI status filtering.
- Infinite scrolling using AG Grid's Infinite Row Model. The demo datasource pages an in-memory sample dataset.
- Unmapped rows expose **ACT**. ACT runs a deterministic mock GenAI generator, changes the row status to **GENAI**, and populates suggested mapping values and a satisfaction score.
- GENAI rows expose **Satisfaction Score** and **Action** columns with Approve / Reject.
- Approve / Reject opens a comment dialog. **Send Comment** stores the decision and comment in memory.
- Clicking a row opens its details panel. Action buttons are handled separately from row clicks.

## Compatibility

- Standalone Angular component and service; no NgModule, module federation, or app-shell dependency.
- Uses unscoped AG Grid packages: `ag-grid-angular`, `ag-grid-community`, and `ag-grid-enterprise`.
- The feature was authored against AG Grid `~35.3.1`. Confirm compatibility with the Angular version and dependency policy in your host application before installing.
- Register the required AG Grid modules only once in the host application.

## Test locally inside your existing Angular application

> This repository folder is a feature bundle, not a complete Angular workspace. Do not run `npm install` or `npm start` from the repository root. Run those commands from your host Angular application's root folder.

### 1. Get the feature bundle

In Terminal:

```bash
git clone --branch feature/dq-code-management https://github.com/ddldmlproject-glitch/recon-portal.git
```

The feature source is:

```text
recon-portal/dq-code-management-copy/src/app/features/dq-code-management
```

### 2. Copy the feature into your Angular workspace

From the cloned repository, copy the folder into your host application's `src/app/features/` directory. The final path should be:

```text
<your-angular-project>/src/app/features/dq-code-management/
```

You can use the included PowerShell helper on Windows:

```powershell
.\dq-code-management-copy\copy-dq-code-management.ps1 -TargetProject "C:\path\to\your\angular-project"
```

On macOS/Linux, use Finder or run:

```bash
mkdir -p /path/to/your/angular-project/src/app/features
cp -R dq-code-management-copy/src/app/features/dq-code-management /path/to/your/angular-project/src/app/features/
```

If the destination already exists, back it up or remove it before copying; the PowerShell helper intentionally refuses to overwrite it.

### 3. Install/check AG Grid dependencies

Run this from the host Angular project's root:

```bash
npm ls @angular/core ag-grid-angular ag-grid-community ag-grid-enterprise
```

If AG Grid 35.3.1 is compatible with your host Angular version and is not already installed, install the aligned packages:

```bash
npm install ag-grid-angular@~35.3.1 ag-grid-community@~35.3.1 ag-grid-enterprise@~35.3.1
```

Do not install a second AG Grid version if the host already standardizes on another version. In that case, align the feature imports and APIs to the host's installed AG Grid version.

### 4. Register the Infinite Row Model

In the host bootstrap file (usually `src/main.ts` or a file imported by it), register these modules once:

```ts
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { InfiniteRowModelModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
  AllCommunityModule,
  InfiniteRowModelModule
]);
```

If your application already registers `AllCommunityModule`, add only the missing `InfiniteRowModelModule`; do not register the same modules repeatedly.

### 5. Add a route

In the host route configuration (commonly `src/app/app.routes.ts`), add:

```ts
{
  path: 'dq-code-management',
  loadComponent: () =>
    import('./features/dq-code-management/dq-code-management.component')
      .then(m => m.DqCodeManagementComponent)
}
```

Adjust the relative import path if your route file is nested in another directory. If your host uses a menu/page registry rather than direct routes, register this route through that existing mechanism.

### 6. Start your host app

From the host Angular project's root:

```bash
npm install
npm start
```

If there is no `start` script, use:

```bash
npx ng serve
```

Open the local URL printed by Angular CLI and append:

```text
/dq-code-management
```

For example, if the terminal reports `http://localhost:4200`, open `http://localhost:4200/dq-code-management`.

## Local functional test checklist

1. Open the route and confirm sample records appear.
2. Select **Unmapped** and confirm Unmapped rows are shown.
3. Click **ACT** on an Unmapped row.
4. Confirm the row changes to **GENAI** and suggested mapping fields and satisfaction score appear.
5. Confirm GENAI rows show **Approve** and **Reject**.
6. Click a row to inspect its details panel.
7. Click **Approve**, enter a comment, and click **Send Comment**.
8. Repeat with **Reject** and a comment.
9. Scroll down to test loading the next page of sample records.
10. Refresh the browser and confirm the demo resets to its initial sample data.

## Backend/configuration notes

- No API is connected. `DqCodeManagementMockService` supplies sample rows and simulates paging, GenAI suggestions, and review decisions in memory.
- ACT is deterministic mock behavior; it does not call a real GenAI model.
- Decisions and comments are not persisted. Refreshing the page resets demo changes.
- The JSON examples in `config/dq-code-page.config.json` and `config/dq-code-grid.config.json` are declarative backend-ready configuration examples. TypeScript config under the feature is used as the demo fallback.
- A production paging API should accept `startRow`, `endRow`, and `mappingStatus`, and return rows plus `lastRow`.
- The backend should persist generated values, status `GENAI`, satisfaction score, reviewer decision, and comment.
