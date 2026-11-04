# Grouping & Approvals — Angular 21 standalone project

This is a separate Angular CLI application stored under its own folder in the repository. It does not change the existing root application.

## Requirements
- Node.js compatible with Angular 21 (use Node 20.19+, 22.12+ or newer supported LTS)
- npm
- Access to npm registry for Angular packages

## Run locally
```bash
cd grouping-approvals-standalone
npm install
npm start
```
Open http://localhost:4200.

## Production build
```bash
npm run build
```

## MFE reuse
The reusable feature is in `src/app/features/grouping-approvals/`. Copy that entire folder into your MFE's feature directory. Import `GroupingApprovalsComponent` in a standalone route or parent component. The feature uses Angular common/core/forms only and has no dependency on this demo shell.

## Architecture
- `grouping-approvals.models.ts`: typed domain contracts
- `grouping-approvals.config.ts`: screen tabs, columns and permissions
- `grouping-approvals.repository.ts`: repository abstraction / injection token
- `grouping-approvals.mock.repository.ts`: local in-memory implementation
- `grouping-approvals.component.*`: feature UI and orchestration

The mock repository is replaceable with an HttpClient-backed implementation. The demo does not call internal Citi services and contains no credentials or internal endpoints.

## Limitations
The demo is a starting implementation based on the supplied screen photos. Validate it against your MFE's exact Angular compiler, design-system wrappers and AG Grid conventions before production integration. Role entitlement tabs are currently a basic configuration UI; detailed business rules and approval workflow states need to be supplied.
