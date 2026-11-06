export type IngestionStatus = 'INGESTED' | 'PROCESSING' | 'FAILED' | 'REMOVED';
export type DocumentType = 'PDF' | 'XLSX' | 'XLS';
export type IngestionFilter = 'ALL' | IngestionStatus;

export interface IngestionDocument {
  documentId: string;
  fileName: string;
  fileType: DocumentType;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  documentCategory: string;
  status: IngestionStatus;
  chunks: number;
  description: string;
  removalReason?: string;
  removedAt?: string;
}

export interface UploadDocumentCommand {
  file: File;
  uploadedBy: string;
  documentCategory: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}
