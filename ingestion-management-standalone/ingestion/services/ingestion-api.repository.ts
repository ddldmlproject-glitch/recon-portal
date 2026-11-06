import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { INGESTION_API_CONFIG, INGESTION_API_CONFIG_TOKEN } from '../config/ingestion-api.config';
import { ApiResponse, IngestionDocument, UploadDocumentCommand } from '../models/ingestion-document.model';
import { IngestionRepository } from './ingestion.repository';

/** HTTP implementation. API response objects are typed before reaching the component. */
@Injectable()
export class IngestionApiRepository implements IngestionRepository {
  private readonly http = inject(HttpClient);
  private readonly api = inject(INGESTION_API_CONFIG_TOKEN, { optional: true }) ?? INGESTION_API_CONFIG;

  async getDocuments(): Promise<IngestionDocument[]> {
    const result = await firstValueFrom(this.http.get<ApiResponse<IngestionDocument[]> | IngestionDocument[]>(this.api.listUrl));
    return Array.isArray(result) ? result : result.data;
  }

  async uploadDocument(command: UploadDocumentCommand): Promise<IngestionDocument> {
    const body = new FormData();
    body.append('file', command.file);
    body.append('uploadedBy', command.uploadedBy);
    body.append('documentCategory', command.documentCategory);
    const result = await firstValueFrom(this.http.post<ApiResponse<IngestionDocument> | IngestionDocument>(this.api.uploadUrl, body));
    return 'data' in result ? result.data : result;
  }

  async removeDocument(id: string, reason: string): Promise<IngestionDocument> {
    const result = await firstValueFrom(this.http.delete<ApiResponse<IngestionDocument> | IngestionDocument>(this.api.removeUrl(id), { body: { reason } }));
    return 'data' in result ? result.data : result;
  }
}
