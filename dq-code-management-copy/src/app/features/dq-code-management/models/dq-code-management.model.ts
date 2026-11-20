export type MappingStatus = 'MAPPED' | 'UNMAPPED' | 'GENAI' | 'APPROVED' | 'REJECTED';
export type MappingFilter = 'Mapped' | 'Unmapped' | 'GenAI';

export interface DqCodeRecord {
  id: string;
  regulation: string;
  olympusRegulation: string;
  stream: string;
  dqType: string;
  regCode: string;
  desc: string;
  dataType: string;
  mappingStatus: MappingStatus;
  globalCode: string;
  globalDqDescription: string;
  primaryField: string;
  primaryFieldName: string;
  secondaryFieldNames: string[];
  confidenceScore: number | null;
  satisfactionScore: number | null;
  activeFlag: string;
  comments: string;
  createdBy: string;
  createTs: string;
  lastUpdatedBy: string;
  lastUpdateTs: string;
  reviewerDecision?: 'APPROVED' | 'REJECTED';
  reviewerComment?: string;
}

export interface DqPagedResult {
  rows: DqCodeRecord[];
  lastRow: number;
}

export interface DqCodeFilter {
  mappingStatus: MappingFilter;
  regulation: string;
  dataType: string;
}

export interface DqReviewRequest {
  recordId: string;
  decision: 'APPROVED' | 'REJECTED';
  comment: string;
}
