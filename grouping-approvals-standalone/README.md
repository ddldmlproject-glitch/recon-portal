# Grouping & Approvals — Configuration-driven Angular 21 standalone application

A standalone Angular application for the Grouping & Approvals domain. The application is structured so that screen definitions, form metadata, grid columns, actions and API operation mappings are kept separate from feature presentation and backend persistence.

## Run locally

Requirements: Node.js version supported by Angular 21 and npm.

```bash
cd grouping-approvals-standalone
npm install
npm start
```

Open http://localhost:4200.

Build:
```bash
npm run build
```

## Architecture

```text
src/app/
  core/
    api/          API operation contracts, environment token and HttpClient adapter
    config/       Typed screen and API configuration models
    engine/       Screen registry, form engine, action engine and permission engine
  shared/
    components/
      dynamic-grid/  Reusable AG Grid wrapper
  features/
    grouping-approvals/
      models, screen config, mock repository, API repository and feature UI
```

### Configuration-first design

- `ScreenConfig` describes a screen layout, data source, grid metadata, fields, tabs and actions.
- `FieldConfig` describes form controls, defaults, options and validation metadata.
- `GridConfig` describes AG Grid column definitions and grid behavior.
- `ActionConfig` refers to a registered Angular handler by ID. Config is declarative; it must not contain executable JavaScript or HTML.
- `ScreenRegistryService` provides typed registration and lookup for screen definitions.
- `FormEngineService` creates Angular reactive forms from field metadata.
- `PermissionEngineService` provides a UI permission check. Backend services must still enforce authorization.
- `ActionEngineService` dispatches registered Angular handlers.

### AG Grid

The reusable `DynamicGridComponent` wraps AG Grid Community. Current package versions are aligned at 36.3.0, which supports Angular 20–22 and TypeScript 5.8.3+. Community modules are registered once in `app.config.ts`.

### Persistence and microservices

The UI depends on `GroupingApprovalsRepository`, not directly on HTTP. Two implementations are provided:

- `GroupingApprovalsMockRepository`: current local demo provider; data is in-memory and resets when the application reloads.
- `GroupingApprovalsApiRepository`: HttpClient-backed adapter using operation IDs from `API_ENVIRONMENT_CONFIG`.

The app currently selects the mock repository in `app.config.ts`. When backend contracts are ready, change the `GROUPING_APPROVALS_REPOSITORY` provider to `GroupingApprovalsApiRepository`. Update the base URL, endpoint paths, request/response DTOs and authentication integration to match the actual microservice contracts. The example `/api` paths are placeholders, not live service endpoints.

## Reuse inside an existing MFE

The project folder is a separate Angular CLI application. For MFE integration, copy the feature folder and its required shared/core dependencies, or extract those folders into a shared library. Import the standalone `GroupingApprovalsComponent` from the MFE route. Align Angular and AG Grid versions with the host MFE and use the host's authentication, HTTP interceptors and design-system theme.

## Current functional scope

- Group list and recon trigger list displayed with AG Grid.
- Config-defined grid columns, sorting, filtering, resizing, pagination and row selection.
- Create and edit group dialogs with recon, user, role and tools/report sections.
- CSV export for groups.
- Mock and API repository implementations with a provider switch.

## Not yet production-complete

The present commit establishes the configuration-driven foundation and migrates the current group/trigger tables to AG Grid. The full User CRUD, role-permission matrix, tool catalog, report builder, recon-ID selection, delete workflow, approval state machine, backend DTO alignment, authentication integration and automated test suite still require detailed business requirements and real microservice contracts. No build or runtime test has been run in this remote GitHub editing session; run `npm install` and `npm run build` locally before treating it as build-verified.
