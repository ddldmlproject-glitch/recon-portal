import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { DqCodeRecord, DqReviewRequest } from '../models/dq-code-management.model';

@Injectable({ providedIn: 'root' })
export class DqCodeManagementMockService {
  private readonly reviewed = new Map<string, DqCodeRecord>();

  submitReview(record: DqCodeRecord, request: DqReviewRequest): Observable<DqCodeRecord> {
    const updated: DqCodeRecord = {
      ...record,
      mappingStatus: request.decision,
      reviewerDecision: request.decision,
      reviewerComment: request.comment.trim(),
      comments: request.comment.trim(),
      lastUpdatedBy: 'DEMO_REVIEWER',
      lastUpdateTs: new Date().toISOString()
    };
    this.reviewed.set(record.id, updated);
    return of({ ...updated });
  }

  getReviewedRecord(id: string): DqCodeRecord | undefined {
    const row = this.reviewed.get(id);
    return row ? { ...row } : undefined;
  }
}