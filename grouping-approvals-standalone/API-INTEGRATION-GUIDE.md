# API Integration Guide — Admin

This guide explains how to connect the standalone Angular 21 application to backend microservices. It covers the built-in Grouping and Orchestration screens, plus screens created through the visual Screen Designer.

> **Important:** The application currently starts with mock data. The API paths in `src/app/core/config/api-environment.config.ts` are integration examples/placeholders. Confirm the actual base URL, endpoints, authentication, DTOs, pagination and error contract with the backend team before enabling the API repository.

## 1. Architecture and ownership

Keep the UI configuration-driven and keep persistence behind repositories:

```text
Screen Designer / ScreenConfig
          |
          v
ScreenRegistryService -> DynamicScreenComponent -> DynamicGridComponent
          |                       |
          |                       v
          |                 DynamicFormComponent
          |                       |
          v                       v
Feature Component ----> Feature Repository Interface
                                |
                    +-----------+-----------+
                    |                       |
                    v                       v
             Mock Repository          API Repository
                    |                       |
             Demo in-memory          ApiClientService
                                            |
                                            v
                                     HTTP microservice
```

Responsibilities:

- **Angular UI:** navigation, field definitions, form rendering, grid columns, client-side validation, user interactions and display state.
- **Feature repository:** typed business operations such as list/create/update/delete/approve.
- **API client:** HTTP verbs, base URL, path parameters, query parameters and request execution.
- **Microservices:** authorization, business validation, workflow rules, persistence, audit history and authoritative data.
- **Screen configuration:** describes how a screen looks. It must not contain secrets, tokens or backend authorization rules.

Never call `HttpClient` directly from a grid cell renderer or generic screen component. Keep backend calls in repository adapters.

## 2. Existing screens and API operations

The current API operation registry is:

File: `src/app/core/config/api-environment.config.ts`

| Screen / action | Operation ID | Example method and path |
|---|---|---|
| Grouping list | `groupsList` | GET `/groups` |
| Create group | `groupsCreate` | POST `/groups` |
| Update group | `groupsUpdate` | PUT `/groups/:id` |
| Delete group | `groupsDelete` | DELETE `/groups/:id` |
| Decision workflow group | `groupsDecision` | POST `/groups/:id/decision` |
| Orchestration list | `triggersList` | GET `/recon-load-triggers` |

These are illustrative contracts, not confirmation that those routes exist in your environment. Replace them with the routes agreed with the service owners.

### Expected contract examples to agree with backend

The following payloads are examples based on the current UI model. Confirm names, required fields, enum values, response envelopes and date formats with the backend team.

Create group request example:

```json
{
  "groupName": "USER_MAKER",
  "description": "Maker access",
  "owner": "user123",
  "approvers": ["approver1"],
  "reconSelection": "Recon IDs",
  "reconIds": ["R-10021"],
  "allEntities": 0,
  "status": "Pending",
  "userIds": ["maker1"],
  "roles": ["Maker"],
  "toolsAndReports": ["Recon Summary"]
}
```

Approval decision request example:

```json
{
  "decision": "Approved",
  "comment": "Reviewed and approved"
}
```

List responses are currently typed as arrays. If the service returns an envelope such as `{ "data": [...], "total": 100 }`, add a response DTO/mapper in the API repository instead of making the generic grid understand the backend envelope.

## 3. Configure the API base URL

Edit `src/app/core/config/api-environment.config.ts`:

```typescript
export const API_ENVIRONMENT_CONFIG: ApiEnvironmentConfig = {
  baseUrl: '/api',
  operations: {
    groupsList: { id: 'groupsList', method: 'GET', path: '/groups' },
    groupsCreate: { id: 'groupsCreate', method: 'POST', path: '/groups' },
    groupsUpdate: { id: 'groupsUpdate', method: 'PUT', path: '/groups/:id' },
    groupsDelete: { id: 'groupsDelete', method: 'DELETE', path: '/groups/:id' },
    groupsDecision: { id: 'groupsDecision', method: 'POST', path: '/groups/:id/decision' },
    triggersList: { id: 'triggersList', method: 'GET', path: '/recon-load-triggers' }
  }
};
```

Recommended environments:

- Local development: use an Angular dev-server proxy or a local API gateway to forward `/api` to the backend.
- Shared development/test: configure the environment-specific gateway URL through environment configuration or deployment configuration.
- Production: use the approved gateway and HTTPS. Do not hardcode credentials or environment-specific secrets in source control.

If the backend is on another origin, configure CORS on the backend/gateway. Adding arbitrary request headers in Angular does not fix a server-side CORS policy.

## 4. Switch from mock data to the API repository

The active provider is in `src/app/app.config.ts`. The current setup is intentionally mock-first:

```typescript
import { GroupingApprovalsApiRepository } from './features/grouping-approvals/grouping-approvals.api.repository';
import { GroupingApprovalsMockRepository } from './features/grouping-approvals/grouping-approvals.mock.repository';

// Keep mock provider while developing without a backend:
{ provide: GROUPING_APPROVALS_REPOSITORY, useClass: GroupingApprovalsMockRepository }

// Once endpoints and DTOs are confirmed, replace it with:
{ provide: GROUPING_APPROVALS_REPOSITORY, useClass: GroupingApprovalsApiRepository }
```

Do not register both providers for the same injection token in the same provider list and expect them to be selected automatically. Choose one provider per environment/build configuration.

The API adapter already implements the repository methods:

- `getGroups()`
- `getTriggers()`
- `createGroup()`
- `saveGroup()`
- `deleteGroup()`
- `decideGroup()`

Check `grouping-approvals.api.repository.ts` against the real service contract. Update request and response types if the service differs.

## 5. How a UI action reaches the service

Example: loading groups.

1. `GroupingApprovalsComponent.loadData()` calls `repository.getGroups()`.
2. Angular injects the implementation selected by `GROUPING_APPROVALS_REPOSITORY`.
3. With the mock provider, the mock repository returns demo records.
4. With the API provider, `GroupingApprovalsApiRepository.getGroups()` calls `ApiClientService.request('groupsList')`.
5. `ApiClientService` looks up the operation ID in `API_ENVIRONMENT`, builds the URL and issues the HTTP request.
6. The repository returns typed data to the feature component.
7. The component updates its signals; the grid renders the new rows.

Create, update, delete and decision actions follow the same repository boundary.

## 6. Add a new API-backed screen

Use this sequence when adding a new permanent business screen, for example User Management.

### Step 1 — Agree the service contract

Ask the backend team for:
- Service/base path and environment URLs.
- List, detail, create, update and delete endpoints required by the screen.
- Query parameters, pagination and sorting conventions.
- Request and response JSON examples.
- Field constraints and server-side validation errors.
- Authentication scopes/roles and audit requirements.
- Error response format and correlation/request ID conventions.

Do not infer API routes from the screen title or invent production endpoints.

### Step 2 — Define frontend models

Create a feature model/DTO file, for example `user-management.models.ts`:

```typescript
export interface UserRecord {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
}
```

Match the backend contract. If its names differ from the UI, define separate API DTOs and map them to the UI model.

### Step 3 — Define the repository contract

Create `user-management.repository.ts`:

```typescript
import { InjectionToken } from '@angular/core';
import { UserRecord } from './user-management.models';

export interface UserManagementRepository {
  list(): Promise<UserRecord[]>;
  create(value: Omit<UserRecord, 'userId'>): Promise<UserRecord>;
  update(id: string, value: Partial<UserRecord>): Promise<UserRecord>;
  remove(id: string): Promise<void>;
}

export const USER_MANAGEMENT_REPOSITORY =
  new InjectionToken<UserManagementRepository>('USER_MANAGEMENT_REPOSITORY');
```

Adjust the example signatures to the actual business requirements and backend contract.

### Step 4 — Register operation IDs

Add operation definitions to `API_ENVIRONMENT_CONFIG.operations`:

```typescript
usersList: { id: 'usersList', method: 'GET', path: '/users' },
usersCreate: { id: 'usersCreate', method: 'POST', path: '/users' },
usersUpdate: { id: 'usersUpdate', method: 'PUT', path: '/users/:id' },
usersDelete: { id: 'usersDelete', method: 'DELETE', path: '/users/:id' }
```

These paths are examples only. Replace them with the confirmed routes.

### Step 5 — Implement the API repository

Create `user-management.api.repository.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../core/api/api-client.service';
import { UserManagementRepository } from './user-management.repository';
import { UserRecord } from './user-management.models';

@Injectable()
export class UserManagementApiRepository implements UserManagementRepository {
  private readonly api = inject(ApiClientService);

  list(): Promise<UserRecord[]> {
    return this.api.request('usersList');
  }

  create(value: Omit<UserRecord, 'userId'>): Promise<UserRecord> {
    return this.api.request('usersCreate', { body: value });
  }

  update(id: string, value: Partial<UserRecord>): Promise<UserRecord> {
    return this.api.request('usersUpdate', { pathParams: { id }, body: value });
  }

  remove(id: string): Promise<void> {
    return this.api.request('usersDelete', { pathParams: { id } });
  }
}
```

If the API uses a response wrapper or different field names, map the response in this class. Keep the grid and dynamic screen independent of backend-specific response shapes.

### Step 6 — Register the repository provider

In `app.config.ts` (or a feature-level provider configuration), register the selected implementation:

```typescript
{ provide: USER_MANAGEMENT_REPOSITORY, useClass: UserManagementApiRepository }
```

For local UI work, create a `UserManagementMockRepository` implementing the same interface and select it instead.

### Step 7 — Define the screen metadata

Create a `ScreenConfig<UserRecord>` with a unique ID, title, `dataSource` operation ID, grid row ID and columns. Register it with `ScreenRegistryService`. Add a feature component that loads through the repository and passes the config and rows to `DynamicScreenComponent`.

A screen definition describes the UI; it does not automatically create backend endpoints or a repository. The feature component/repository connection is required.

### Step 8 — Connect create/edit forms

Use `FieldConfig[]` with `DynamicFormComponent`. On its `submitted` output, call the repository, handle validation/API errors, then refresh or update the feature's signal state. Never put service URLs or HTTP calls into the generic form component.

## 7. Screens created through the visual Screen Designer

The current **+ Create Screen** flow is a frontend-only demo:

- The user enters a screen name and description.
- The user adds fields using the visual field builder (field name, type, required flag and optional dropdown choices).
- The app generates a `ScreenConfig` and `FieldConfig[]`.
- `ScreenRegistryService` registers the config and the tab appears immediately.
- `DynamicScreenComponent` renders the generated grid; `DynamicFormComponent` renders the Add Record form.
- `UserScreenStorageService` stores definitions and records in browser `localStorage`.

This currently does **not** create an API endpoint or connect a newly created screen to a microservice. Records are local to that browser and are not shared across users.

### Production architecture for configurable screens

For multi-user/API-backed screen creation, add a Screen Definition service and a data resource service. A possible contract to discuss with backend architects is:

| Purpose | Example operation | Notes |
|---|---|---|
| Save screen definition | POST `/screen-definitions` | Persist metadata and field definitions |
| List definitions for current user/role | GET `/screen-definitions` | Return only definitions user is authorized to discover |
| Read definition | GET `/screen-definitions/:screenId` | Include version and permissions |
| Update definition | PUT `/screen-definitions/:screenId` | Validate schema/version changes |
| Delete/archive definition | DELETE `/screen-definitions/:screenId` | Apply retention and dependency rules |
| List screen records | GET `/screen-definitions/:screenId/records` | Support paging, sorting and filtering |
| Create record | POST `/screen-definitions/:screenId/records` | Validate values against server-side schema |
| Update record | PUT/PATCH `/screen-definitions/:screenId/records/:recordId` | Enforce record-level authorization |
| Delete record | DELETE `/screen-definitions/:screenId/records/:recordId` | Audit destructive actions |

These are proposed design examples, not existing implemented endpoints. The backend must validate screen definitions and record payloads independently; never trust client-generated field metadata for security.

Recommended metadata to persist includes screen ID, display name, description, version, field key/label/type, required flag, select options, validators, grid visibility/order/width, data resource identifier, allowed actions and permission identifiers. Store only resource identifiers/operation IDs in metadata, never arbitrary executable code or raw URLs supplied by end users.

Use an allow-listed resource registry in the frontend/backend to map a screen's resource ID to approved repository operations. Do not allow a user-created screen to invoke arbitrary HTTP URLs or arbitrary methods.

For the production data layer, implement a generic `DynamicScreenRepository` (or resource-specific repository registry) that resolves an approved resource ID to list/create/update/delete methods. Validate every record against the saved schema on the server. Include schema versioning/migrations, audit history, ownership, role-based authorization, rate limits and pagination.

## 8. Authentication, authorization and security

- Use the organization's approved OAuth/OIDC or SSO integration.
- Attach access tokens through an Angular HTTP interceptor or the approved API gateway integration; do not store long-lived secrets in screen configuration or local storage.
- Configure token refresh and 401/403 handling centrally.
- Backend services must enforce authorization for every operation and every record. Hiding a button in Angular is not authorization.
- Validate all input on the server, even when Angular validators are present.
- Do not put sensitive, regulated or production data in the local-storage screen designer demo.
- Avoid logging tokens, sensitive payloads or personal data. Use correlation IDs for troubleshooting.

The current `provideHttpClient()` setup does not install a custom authentication interceptor. Add the enterprise-approved interceptor when the identity integration details are known.

## 9. Error handling and API behavior

The feature component currently catches rejected repository promises and displays a message. Before production:
- Normalize backend errors in the API/repository layer into safe user-facing messages.
- Distinguish validation (400/422), unauthenticated (401), forbidden (403), missing (404), conflict (409), rate limit (429) and server/network failures (5xx).
- Preserve field-level validation errors so they can be shown beside the relevant form field.
- Add loading, empty, retry and stale-data states.
- Prevent duplicate submissions while a request is pending.
- Confirm delete operations and let the server enforce delete permissions.
- Use server-side pagination/filtering for large datasets instead of loading all rows into the browser.

## 10. Integration and test checklist

### Mock mode
1. Keep `GroupingApprovalsMockRepository` selected.
2. Run `npm install`, `npm start` and open `http://localhost:4200/grouping-approvals`.
3. Test group create/edit/delete and decision workflow flows.
4. Open Orchestration and verify the trigger list.
5. Create a custom screen with the visual field builder, add a record and refresh. Confirm the custom definition and records persist in that browser's local storage.
6. Remember that built-in mock data is in memory and resets on app restart; custom screen data uses local storage.

### API mode (after backend contract is available)
1. Confirm base URL, routes, methods, payloads, response envelopes, auth scopes and CORS/gateway behavior.
2. Configure the correct API environment.
3. Switch the repository provider to the API implementation.
4. Run the app and inspect browser Network requests for the expected URL, method, request body and response.
5. Verify list, create, update, delete and decision operations with authorized test data.
6. Verify 401, 403, 404, 409, validation errors, timeout/offline behavior and server errors.
7. Verify that unauthorized users cannot perform restricted actions by calling the API directly, not just by checking hidden buttons.
8. Verify pagination, sorting, filtering and audit metadata against backend behavior.
9. Run `npm run build` and automated tests before merging.

## 11. Current implementation boundary

| Capability | Current state |
|---|---|
| Groups and triggers UI | Implemented with mock-first repository |
| Groups API adapter | Example adapter exists; contract needs backend confirmation |
| Visual screen designer | Implemented as browser-local demo |
| Dynamic grid/form rendering | Reusable components available |
| Persist custom screen definitions server-side | Not implemented |
| Persist custom screen records through API | Not implemented |
| Generic API-backed custom-screen resource registry | Not implemented |
| Authentication interceptor/SSO | Not configured in this standalone demo |
| Backend authorization and audit | Must be implemented by services |

Do not describe the visual Screen Designer as fully API-integrated until the definition service, resource registry, record CRUD adapter, authentication and backend authorization are implemented and tested.
