import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { DqCodeFilter, DqCodeRecord, DqPagedResult, DqReviewRequest } from '../models/dq-code-management.model';

@Injectable({ providedIn: 'root' })
export class DqCodeManagementMockService {
  private readonly records: DqCodeRecord[] = Array.from({ length: 240 }, (_, index) => this.makeRecord(index));

  getRows(startRow: number, endRow: number, filter: DqCodeFilter): Observable<DqPagedResult> {
    let filtered = this.records.filter(row => {
      const statusMatches = filter.mappingStatus === 'Mapped'
        ? row.mappingStatus === 'MAPPED' || row.mappingStatus === 'APPROVED'
        : filter.mappingStatus === 'Unmapped'
          ? row.mappingStatus === 'UNMAPPED'
          : row.mappingStatus === 'GENAI';
      return statusMatches
        && (filter.regulation === 'All' || row.regulation === filter.regulation)
        && (filter.dataType === 'All' || row.dataType === filter.dataType);
    });
    return of({ rows: filtered.slice(startRow, endRow), lastRow: filtered.length });
  }

  generateGenAi(recordId: string): Observable<DqCodeRecord> {
    const row = this.requireRecord(recordId);
    const code = `dq_ai_${String(Number(recordId.split('-').pop()) + 1).padStart(3, '0')}`;
    Object.assign(row, {
      mappingStatus: 'GENAI',
      globalCode: code,
      globalDqDescription: `AI suggested mapping for ${row.desc}`,
      primaryFieldName: row.primaryFieldName || 'Generated primary field',
      confidenceScore: 0.91,
      satisfactionScore: 88 + (Number(recordId.split('-').pop()) % 12),
      comments: 'GenAI suggestion generated. Awaiting reviewer decision.',
      lastUpdatedBy: 'GENAI',
      lastUpdateTs: new Date().toISOString()
    });
    return of({ ...row });
  }

  submitReview(request: DqReviewRequest): Observable<DqCodeRecord> {
    const row = this.requireRecord(request.recordId);
    Object.assign(row, {
      mappingStatus: request.decision,
      reviewerDecision: request.decision,
      reviewerComment: request.comment.trim(),
      comments: request.comment.trim(),
      lastUpdatedBy: 'DEMO_REVIEWER',
      lastUpdateTs: new Date().toISOString()
    });
    return of({ ...row });
  }

  private requireRecord(id: string): DqCodeRecord {
    const row = this.records.find(item => item.id === id);
    if (!row) throw new Error(`DQ record ${id} was not found`);
    return row;
  }

  private makeRecord(index: number): DqCodeRecord {
    const genAi = index % 10 === 2 || index % 10 === 7;
    const mapped = !genAi && index % 3 === 0;
    const regulation = ['swxtr', 'm2tr', 'rhoo'][index % 3];
    const status = genAi ? 'GENAI' : mapped ? 'MAPPED' : 'UNMAPPED';
    return {
      id: `DQ-${String(index + 1).padStart(5, '0')}`,
      regulation, olympusRegulation: regulation.toUpperCase(), stream: 'inboxagentic',
      dqType: index % 2 ? 'Exception' : 'Validation',
      regCode: `swxtr_txns_${['value', 'notional', 'price', 'date'][index % 4]}_${String(index + 1).padStart(3, '0')}`,
      desc: ['Strike Price Type is missing', 'UTOTV Value is invalid', 'Underlying value is not mapped', 'Primary Swiss field is required'][index % 4],
      dataType: index % 2 ? 'String' : 'Exception',
      mappingStatus: status,
      globalCode: mapped || genAi ? `dq_${genAi ? 'ai' : 'is'}_utotv_${String(index % 8 + 1).padStart(3, '0')}` : '',
      globalDqDescription: mapped ? 'Global DQ validation mapping' : genAi ? 'AI suggested mapping awaiting reviewer approval' : '',
      primaryField: 'strikePrice', primaryFieldName: mapped || genAi ? 'Strike Price' : '',
      secondaryFieldNames: ['tradeDate', 'instrumentId'],
      confidenceScore: mapped ? 0.98 : genAi ? 0.91 : null, satisfactionScore: genAi ? 88 + (index % 12) : null,
      activeFlag: 'Y', comments: genAi ? 'GenAI suggestion generated. Awaiting reviewer decision.' : '', createdBy: 'DQ_DEMO', createTs: new Date(Date.now() - index * 3600000).toISOString(),
      lastUpdatedBy: 'DQ_DEMO', lastUpdateTs: new Date(Date.now() - index * 1800000).toISOString()
    };
  }
}
