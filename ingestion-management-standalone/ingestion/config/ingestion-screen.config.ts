import type { ColDef } from 'ag-grid-community';
import type { IngestionDocument, IngestionFilter, IngestionStatus } from '../models/ingestion-document.model';

export interface IngestionScreenConfig {
  title: string;
  description: string;
  filters: { id: IngestionFilter; label: string }[];
  metrics: { id: string; label: string; caption: string; status?: IngestionStatus }[];
  upload: { extensions: string[]; maxSizeMb: number; categories: string[]; defaultCategory: string };
  columns: ColDef<IngestionDocument>[];
}

/** Change screen behavior and labels here; the component does not own screen metadata. */
export const INGESTION_SCREEN_CONFIG: IngestionScreenConfig = {
  title: 'Ingestion management',
  description: 'Review source documents and manage the knowledge ingestion lifecycle.',
  filters: [
    { id: 'ALL', label: 'All documents' },
    { id: 'INGESTED', label: 'Ingested' },
    { id: 'PROCESSING', label: 'Processing' },
    { id: 'FAILED', label: 'Failed' },
    { id: 'REMOVED', label: 'Removed' }
  ],
  metrics: [
    { id: 'total', label: 'Total documents', caption: 'All repository records' },
    { id: 'ingested', label: 'Ingested', caption: 'Available in the collection', status: 'INGESTED' },
    { id: 'processing', label: 'Processing', caption: 'Waiting for completion', status: 'PROCESSING' },
    { id: 'failed', label: 'Failed', caption: 'Requires attention', status: 'FAILED' },
    { id: 'removed', label: 'Removed', caption: 'Retained in audit history', status: 'REMOVED' }
  ],
  upload: {
    extensions: ['pdf', 'xlsx', 'xls'], maxSizeMb: 25,
    defaultCategory: 'Technical Specification',
    categories: ['Technical Specification', 'Business Requirements', 'Architecture', 'API Specification', 'Reference Data', 'Other']
  },
  columns: [
    { field: 'fileName', headerName: 'Document name', minWidth: 250, flex: 2 },
    { field: 'documentCategory', headerName: 'Category', minWidth: 170, flex: 1 },
    { field: 'uploadedBy', headerName: 'Uploaded by', minWidth: 140 },
    { field: 'uploadedAt', headerName: 'Uploaded date', minWidth: 160, valueFormatter: p => p.value ? new Date(p.value).toLocaleString() : '—' },
    { field: 'fileSize', headerName: 'File size', minWidth: 100, valueFormatter: p => p.value ? `${(Number(p.value) / 1048576).toFixed(2)} MB` : '—' },
    { field: 'status', headerName: 'Status', minWidth: 130 },
    { field: 'chunks', headerName: 'Chunks', minWidth: 90 }
  ]
};
