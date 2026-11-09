# ReghubOps Admin — Angular standalone demo

A standalone Angular application for testing the ReghubOps administration workflows.

## Included in the current demo

- **Grouping:** list, search, create, edit, delete and CSV export for entitlement groups.
- **Inbox:** review pending group requests and demo approval/rejection actions.
- **Orchestration:** view orchestration trigger records.
- Reusable screen configuration, dynamic grid and dynamic form components.
- Mock repositories for local testing.

**Create Screen and user-created/custom screen functionality are intentionally excluded from this branch for now.**

## Run locally

From the repository root:

```bash
cd grouping-approvals-standalone
npm install
npm start
```

Open http://localhost:4200/grouping-approvals.

Build:

```bash
npm run build
```

## Copy-ready Grouping Approvals bundle

A separate copy-ready feature package is available in:

`grouping-approvals-standalone/grouping-approvals-copy/`

It contains only the Grouping Approvals feature and its required screen configuration, mock repository, dynamic form/grid/screen components, plus a PowerShell copy script and integration instructions.

Preview the copy operation:

```powershell
.\grouping-approvals-copy\copy-grouping-approvals.ps1 -TargetProject "C:\path\to\your\angular-project" -WhatIf
```

Run the copy:

```powershell
.\grouping-approvals-copy\copy-grouping-approvals.ps1 -TargetProject "C:\path\to\your\angular-project"
```

The script never overwrites existing target files. Review any skipped-file warnings and manually merge collisions. Then follow the bundle README to add the route, provider and compatible AG Grid dependencies without replacing the target app configuration.

## Demo data and backend integration

The default Grouping repository is in-memory mock data. Changes reset when the application is restarted. Replace `GroupingApprovalsMockRepository` with an implementation of `GroupingApprovalsRepository` when connecting the backend. API URLs and payload examples are integration placeholders until aligned with actual service contracts.

The frontend demo does not provide production authorization or durable shared persistence. Connect the host application's authentication, permissions and backend authorization before production use.

## Validation

A GitHub Actions build workflow is configured for this standalone application. Check the Actions tab for the latest run. Always run `npm run build` locally before merging into a consuming application.
