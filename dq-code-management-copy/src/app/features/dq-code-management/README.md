# DQ Code Management

A small, configuration-driven Angular feature intended to be copied into the Citi MFE.

## Files
- `config/dq-code-management.config.ts`: default filters, API request, and grid columns.
- `services/dq-code-management-mock.service.ts`: temporary in-memory review save.
- `dq-code-management.component.ts`: Facts loading, response mapping, filtering, and review actions.
- HTML and SCSS: screen layout and styling.

## Integration
Copy this folder into the Citi MFE, add `DqCodeManagementComponent` to the required route, and use the host MFE's existing HttpClient interceptors, authentication, and gateway routing. Keep the host package.json unchanged.

## Configuration
Update `DQ_CODE_PAGE_CONFIG` for default regulation/status, filter choices, Facts URL, and request body. Update `DQ_CODE_GRID_COLUMNS` to change grid columns. Facts loads automatically when the page opens; changing Regulation reloads it; Mapping Status filters the loaded rows.

## Behavior
Unmapped rows show ACT as a local placeholder and do not call an API. GENAI rows show Approve/Reject and require a comment. Review currently saves to browser memory only; replace the mock service with the Mongo save endpoint when its contract is available.

The response adapter currently reads `factContainers[].dqInbox` or the container itself. Adjust `mapFact()` if the response shape differs.
