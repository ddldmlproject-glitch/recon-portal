# Ingestion feature — configuration-driven integration

Copy the `ingestion/` folder into `src/app/features/ingestion/` in the existing standalone Angular application. This branch contains feature code only; it does not add an AppComponent, routes, bootstrap files, package.json or angular.json.

## Object-oriented structure

- `models/`: typed API/domain objects.
- `config/ingestion-screen.config.ts`: declarative filters, metrics, upload rules and AG Grid column definitions.
- `config/ingestion-api.config.ts`: API endpoint configuration.
- `services/ingestion.repository.ts`: repository abstraction used by the component.
- `services/ingestion-api.repository.ts`: HTTP adapter returning typed API objects.
- `services/ingestion-mock.repository.ts`: local mock implementation of the same contract.
- `components/`: UI and interaction logic only.

## Add to the existing landing page

Import `IngestionDashboardComponent` in your existing standalone landing component and add it to that component's `imports` array. Add this class property:

```ts
showIngestion = false;
```

Use this template:

```html
@if (!showIngestion) {
  <button type="button" (click)="showIngestion = true">Ingestion Management</button>
} @else {
  <ing-dashboard (close)="showIngestion = false" />
}
```

No Angular Router changes are needed.

## Connect the real API

The component currently uses the mock repository. When the backend contract is ready:

1. Ensure the existing host app already provides Angular HttpClient.
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
4. The sample adapter accepts a GET response of either `IngestionDocument[]` or `{ data: IngestionDocument[] }`; upload/remove accept either an `IngestionDocument` or `{ data: IngestionDocument }`. Update the adapter/mapping to match your exact backend response object.
5. The host project must already have compatible `ag-grid-angular` and `ag-grid-community` packages and AG Grid registration.

The mock stores metadata in localStorage and simulates processing only. It does not send file bytes to a server, call an LLM, create embeddings, or delete actual vector-store records.
