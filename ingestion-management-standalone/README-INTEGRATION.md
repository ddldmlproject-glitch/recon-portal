# Ingestion feature — local preview and host integration

This folder supports two use cases:

1. **Run locally:** use the small Angular 21 demo shell in this folder to preview and test the feature independently.
2. **Integrate into your host MFE:** copy only the reusable `ingestion/` folder into the existing Angular application's feature area. Do not copy the demo shell files into the host app.

## Run the local preview

Use Node.js `20.19+`, `22.12+`, or `24+`.

```bash
cd ingestion-management-standalone
npm install
npm start
```

Open the local URL printed by Angular CLI (normally `http://localhost:4200`). Select **Open feature** to open Ingestion Management. Use **Back to workspace** to return to the preview landing page.

The preview uses `IngestionMockRepository` and browser localStorage. It demonstrates the UI and mock workflow only; it does not send file contents to a backend, call an LLM, create embeddings, or update a real vector store. The records grid includes Edit and Delete actions. Edit updates document category and description. Delete marks a record as Removed and keeps its audit row in the Removed filter.

## Reusable object-oriented feature structure

- `ingestion/models/`: typed API/domain objects.
- `ingestion/config/ingestion-screen.config.ts`: declarative filters, metrics, upload rules and AG Grid column definitions.
- `ingestion/config/ingestion-api.config.ts`: API endpoint configuration.
- `ingestion/services/ingestion.repository.ts`: repository abstraction used by the component.
- `ingestion/services/ingestion-api.repository.ts`: HTTP adapter returning typed API objects.
- `ingestion/services/ingestion-mock.repository.ts`: local mock implementation of the same contract.
- `ingestion/components/`: UI and interaction logic only.

## Integrate into the existing Angular host MFE

Copy only:

```text
ingestion-management-standalone/ingestion/
```

into:

```text
<your-existing-angular-project>/src/app/features/ingestion/
```

Import `IngestionDashboardComponent` into the existing standalone landing component and add it to that component's `imports` array. Add this class property:

```ts
showIngestion = false;
```

Use this template:

```html
@if (!showIngestion) {
  <button type="button" (click)="showIngestion = true">Ingestion Management</button>
} @else {
  <ing-dashboard (close)="showIngestion = false"></ing-dashboard>
}
```

No Angular Router changes are needed. The demo shell files under `src/`, as well as `package.json` and `angular.json`, are only for running this feature preview independently; they are not required in your existing host MFE.

## Connect the real API

The feature currently uses the mock repository. When the backend contract is ready:

1. Ensure the existing host app provides Angular `HttpClient`.
2. In `ingestion-dashboard.component.ts`, replace its mock provider with:

```ts
import { IngestionApiRepository } from '../services/ingestion-api.repository';
import { INGESTION_API_CONFIG, INGESTION_API_CONFIG_TOKEN } from '../config/ingestion-api.config';

providers: [
  { provide: INGESTION_REPOSITORY, useClass: IngestionApiRepository },
  { provide: INGESTION_API_CONFIG_TOKEN, useValue: INGESTION_API_CONFIG }
]
```

3. Set the actual endpoint paths in `INGESTION_API_CONFIG`.
4. Match the sample adapter to the backend's exact response object contract. The sample update adapter sends PATCH to `updateUrl(documentId)` with `{ documentCategory, description }`; update that URL/method/body if your API contract differs. Delete is implemented as a soft removal through the configured DELETE endpoint and expects the updated document object in the response.
5. Ensure the host project has compatible `ag-grid-angular` and `ag-grid-community` dependencies and module registration.

The sample adapter accepts a GET response of either `IngestionDocument[]` or `{ data: IngestionDocument[] }`; upload/update/remove accept either an `IngestionDocument` or `{ data: IngestionDocument }`.
