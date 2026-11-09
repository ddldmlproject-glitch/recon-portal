import { InjectionToken } from '@angular/core';
import type {
  IngestionDocument,
  UpdateIngestionDocumentCommand,
  UploadDocumentCommand
} from '../models/ingestion-document.model';

/** Repository contract: the UI is independent of HTTP and mock data implementations. */
export interface IngestionRepository {
  getDocuments(): Promise<IngestionDocument[]>;
  uploadDocument(command: UploadDocumentCommand): Promise<IngestionDocument>;
  updateDocument(id: string, command: UpdateIngestionDocumentCommand): Promise<IngestionDocument>;
  removeDocument(id: string, reason: string): Promise<IngestionDocument>;
}

export const INGESTION_REPOSITORY =
  new InjectionToken<IngestionRepository>('INGESTION_REPOSITORY');
