import { InjectionToken } from '@angular/core';

export interface IngestionApiConfig {
  listUrl: string;
  uploadUrl: string;
  updateUrl: (documentId: string) => string;
  removeUrl: (documentId: string) => string;
}

/** Replace these example paths with the actual endpoints supplied by the backend team. */
export const INGESTION_API_CONFIG: IngestionApiConfig = {
  listUrl: '/api/ingestion/documents',
  uploadUrl: '/api/ingestion/documents',
  updateUrl: id => `/api/ingestion/documents/${encodeURIComponent(id)}`,
  removeUrl: id => `/api/ingestion/documents/${encodeURIComponent(id)}`
};

export const INGESTION_API_CONFIG_TOKEN =
  new InjectionToken<IngestionApiConfig>('INGESTION_API_CONFIG');
