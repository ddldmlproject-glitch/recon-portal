# Grouping & Approvals feature

Standalone Angular 18 feature module for the Recon Portal MFE. The screen definitions, table columns, action definitions and demo data are separated from the presentation layer.

## Screens
- Entitlement Groups grid with create, view, edit, delete and row actions.
- Manage Group Users with a group selector and editable user ID assignment.
- Role Setup with recon scope and role entitlement selection.
- Recon Load Triggers with multi-field search and trigger detail view.

## Configuration-driven / object-oriented design
- `grouping-approvals.models.ts`: typed domain contracts.
- `grouping-approvals.config.ts`: class-based page, navigation, column and action configuration.
- `grouping-approvals-data.service.ts`: repository boundary and local demo implementation.
- `grouping-approvals.component.ts/html/scss`: standalone UI and workflow orchestration.

The UI reads screen metadata and table definitions from configuration. The component works with domain models and a data-service abstraction rather than owning endpoint details. When backend APIs are ready, replace the local implementation behind `GroupingApprovalsDataService` with HttpClient repository methods and map API DTOs to the existing domain models. Keep endpoint URLs, permissions, validation rules and feature visibility in backend-provided configuration rather than hardcoding them in screen templates.

## Run
```bash
npm install
npm start
```

## MFE integration
Import `GroupingApprovalsComponent` into a standalone host component and render `<app-grouping-approvals></app-grouping-approvals>`. Dependencies are Angular 18 and FormsModule; no new packages are required.

All data is currently in-memory demo data. No live API, database or persistence is connected.
