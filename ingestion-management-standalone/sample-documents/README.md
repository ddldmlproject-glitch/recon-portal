# Sample PDF documents

These are one-page fictional PDFs for local UI testing only. They contain no real customer or production information.

- `sample-technical-specification.pdf` — upload under Technical Specification; useful for testing file replacement.
- `sample-business-requirements.pdf` — upload under Business Requirements.
- `sample-api-integration-guide.pdf` — upload under API Specification.

Suggested workflow:

1. Upload `sample-technical-specification.pdf`.
2. Wait for the mock status to change from Processing to Ingested.
3. Use the row's Edit action and select `sample-business-requirements.pdf` as the replacement.
4. Confirm the file name and size change; wait for mock processing to complete.
5. Test metadata-only edits by changing category or description without selecting a replacement file.
6. Test Delete separately; it is a soft removal and keeps an audit row under the Removed filter.

The current mock stores record metadata in browser localStorage, not the PDF bytes. The selected replacement file is held for the current upload request only. Real file transfer requires a backend endpoint that accepts multipart form data.
