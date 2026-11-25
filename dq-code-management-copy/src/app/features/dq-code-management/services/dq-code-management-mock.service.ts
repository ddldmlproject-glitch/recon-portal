import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DqCodeManagementMockService {
  private reviewed = new Map<string, any>();

  saveReview(record: any, decision: 'APPROVED' | 'REJECTED', comment: string): Observable<any> {
    const updated = {
      ...record,
      mappingStatus: decision,
      reviewerDecision: decision,
      reviewerComment: comment.trim(),
      comments: comment.trim(),
      lastUpdatedBy: 'DEMO_REVIEWER',
      lastUpdateTs: new Date().toISOString()
    };
    this.reviewed.set(record.id, updated);
    return of(updated);
  }

  getReviewedRecord(id: string): any {
    return this.reviewed.get(id);
  }
}