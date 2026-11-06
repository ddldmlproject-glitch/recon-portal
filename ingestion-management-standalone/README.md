# Ingestion Management — Angular 21 standalone POC

This is a separate Angular 21 standalone application for the document-ingestion workflow. It does not modify or extend the existing grouping-approvals-standalone application.

## POC capabilities
- Historical document repository grid with search, status filters, sorting and pagination.
- Right-click document actions: view details, export metadata, remove from the mock knowledge collection.
- Double-click row details drawer.
- Remove confirmation with reason; removed records remain in the Removed history filter.
- PDF, XLSX and XLS upload metadata with file extension and 25 MB validation.
- Simulated Processing → Ingested status transition.
- Sample records for ingested, processing, failed and removed documents.
- Responsive document-management workspace.

## Demo flow
1. Search for Resume_Yogesh_Srivastav.pdf (sample wrong-file record).
2. Right-click the row and select Remove from knowledge base.
3. Confirm Uploaded by mistake.
4. Select Removed to view the retained history record.
5. Upload the correct Asthma technical specification PDF as Technical Specification.
6. Observe Processing → Ingested.

## Run
```bash
npm install
npm start
```
Open http://localhost:4200/ingestion.

## Mock-only boundary
The POC stores document metadata in browser localStorage. It does not upload or parse file bytes, call an LLM, create embeddings, or delete real vector records. The mock removal marks the record REMOVED and clears the mock chunk count. Do not represent this as live knowledge-base deletion.

## Live API seam
The UI uses an IngestionRepository interface and an INGESTION_REPOSITORY injection token. Replace IngestionMockRepository with an HttpClient-backed adapter once actual backend contracts are available. Production removal must coordinate source-file deactivation/deletion, chunk and embedding deletion, retrieval-index invalidation and audit history on the backend.

## Copy into the Citi standalone app
Copy src/app/features/ingestion into the host app's src/app/features folder, add the IngestionDashboardComponent route to app.routes.ts, and add an Ingestion navigation item to the host shell. The existing host already uses Angular 21 and AG Grid 36.3.0; ensure AllCommunityModule is registered once by the host.

The full copy-ready source folder is provided as the accompanying ingestion-management-standalone.zip artifact in the ChatGPT conversation.