# DQ Code Management feature

This folder is designed to be copied into an existing standalone Angular Citi MFE.

## Integration

1. Copy the `dq-code-management` folder into your MFE feature directory.
2. Import `DqCodeManagementComponent` in the route where the DQ Code page should appear.
3. Ensure the host MFE provides its normal HTTP interceptors, gateway/proxy routing and authentication. The feature uses Angular `HttpClient` and a relative API path.
4. Ensure the MFE has compatible Angular and AG Grid dependencies. This feature was developed against the versions in the parent `dq-code-management-copy/package.json`; do not replace the host MFE package.json.

## Configuration

Edit `config/dq-code-management.config.ts`:

- `defaultRegulation`: regulation selected when the page opens.
- `defaultMappingStatus`: initial mapping status filter.
- `filters`: filter labels and options.
- `factsApi.url`: relative Facts API path.
- `factsApi.request`: request body, including header regulation, stream and max_records.
- `DQ_CODE_GRID_COLUMNS`: visible/hidden grid columns and action renderers.

The component automatically calls the configured Facts API on initialization. Changing Regulation calls Facts again with the selected regulation. Mapping Status filters the retrieved records locally.

## Facts response mapping

The adapter currently reads `factContainers[].dqInbox` (or the container itself) and maps fields including `id`, `regulation`, `stream`, `dqType`, `regCode`, `desc`, `dataType`, `status`, `globalCode`, `primaryField`, `confidenceScore`, timestamps and comments.

If the service response wraps these fields differently, update only `mapFact()` in `dq-code-management.component.ts`.

## Review behavior

- Unmapped rows display ACT as a local placeholder. It does not call an API.
- Rows with status `GENAI` display Approve and Reject.
- Both actions require a comment.
- Review submissions currently use `DqCodeManagementMockService` and are held in browser memory only. They are not persisted to MongoDB. Replace this service with the final save endpoint when its request/response contract is available.

## Notes

The Facts endpoint is configured as `POST /wiz/ods-fact-service/facts` based on the supplied SoapUI reference. The host MFE must route this relative path to the appropriate environment gateway.
