import { InjectionToken } from '@angular/core';
import type { IngestionDocument, UploadDocumentCommand } from '../models/ingestion-document.model';

/** Repository contract: the UI is independent of HTTP and mock data implementations. */
export interface IngestionRepository {
  getDocuments(): Promise<IngestionDocument[]>;
  uploadDocument(command: UploadDocumentCommand): Promise<IngestionDocument>;
  removeDocument(id: string, reason: string): Promise<IngestionDocument>;
}

export const INGESTION_REPOSITORY =
  new InjectionToken<IngestionRepository>('INGESTION_REPOSITORY');
