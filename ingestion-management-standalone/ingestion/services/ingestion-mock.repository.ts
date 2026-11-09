import { Injectable } from '@angular/core';
import { INGESTION_MOCK_DATA } from '../data/ingestion-mock-data';
import type {
  IngestionDocument,
  UpdateIngestionDocumentCommand,
  UploadDocumentCommand
} from '../models/ingestion-document.model';
import type { IngestionRepository } from './ingestion.repository';

const STORAGE_KEY = 'reghubops.ingestion.documents.v2';

/** Local mock implementation of the same repository contract used by the API adapter. */
@Injectable()
export class IngestionMockRepository implements IngestionRepository {
  private read(): IngestionDocument[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as IngestionDocument[];
    } catch { /* Fall back to sample records. */ }
    return [...INGESTION_MOCK_DATA];
  }

  private write(rows: IngestionDocument[]): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rows)); } catch { /* In-memory demo remains usable. */ }
  }

  async getDocuments(): Promise<IngestionDocument[]> {
    await this.delay(150);
    return this.read().sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }

  async uploadDocument(command: UploadDocumentCommand): Promise<IngestionDocument> {
    await this.delay(300);
    const extension = command.file.name.split('.').pop()?.toUpperCase() ?? 'PDF';
    const created: IngestionDocument = {
      documentId: `DOC-${Date.now()}`, fileName: command.file.name,
      fileType: extension as IngestionDocument['fileType'], fileSize: command.file.size,
      uploadedBy: command.uploadedBy, uploadedAt: new Date().toISOString(),
      documentCategory: command.documentCategory, status: 'PROCESSING', chunks: 0,
      description: 'Demo record only; no file content is sent to an LLM or vector database.'
    };
    this.write([created, ...this.read()]);
    return created;
  }

  async updateDocument(id: string, command: UpdateIngestionDocumentCommand): Promise<IngestionDocument> {
    await this.delay(200);
    const rows = this.read();
    const current = rows.find(row => row.documentId === id);
    if (!current) throw new Error(`Document ${id} was not found.`);
    if (current.status === 'REMOVED') throw new Error('Removed records cannot be edited.');
    const replacement = command.file;
    const replacementType = replacement?.name.split('.').pop()?.toUpperCase();
    const updated: IngestionDocument = {
      ...current,
      fileName: replacement?.name ?? current.fileName,
      fileType: replacementType ? replacementType as IngestionDocument['fileType'] : current.fileType,
      fileSize: replacement?.size ?? current.fileSize,
      uploadedAt: replacement ? new Date().toISOString() : current.uploadedAt,
      documentCategory: command.documentCategory.trim(),
      description: command.description.trim(),
      status: replacement ? 'PROCESSING' : current.status,
      chunks: replacement ? 0 : current.chunks
    };
    this.write(rows.map(row => row.documentId === id ? updated : row));
    return updated;
  }

  async removeDocument(id: string, reason: string): Promise<IngestionDocument> {
    await this.delay(200);
    const rows = this.read();
    const current = rows.find(row => row.documentId === id);
    if (!current) throw new Error(`Document ${id} was not found.`);
    if (current.status === 'REMOVED') return current;
    const updated = {
      ...current,
      status: 'REMOVED' as const,
      chunks: 0,
      removalReason: reason,
      removedAt: new Date().toISOString()
    };
    this.write(rows.map(row => row.documentId === id ? updated : row));
    return updated;
  }

  async completeProcessing(id: string): Promise<void> {
    await this.delay(800);
    this.write(this.read().map(row => row.documentId === id && row.status === 'PROCESSING'
      ? { ...row, status: 'INGESTED', chunks: Math.max(8, Math.round(row.fileSize / 24000)) }
      : row));
  }

  private delay(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }
}
