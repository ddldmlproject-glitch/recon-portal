import type { ColDef } from 'ag-grid-community';
import type { DqCodeRecord } from '../models/dq-code-management.model';

export interface DqPageFilterConfig {
  key: 'regulation' | 'mappingStatus';
  label: string;
  options: string[];
}

export interface DqGridColumnConfig {
  field: keyof DqCodeRecord | 'act' | 'reviewAction';
  headerName: string;
  minWidth?: number;
  hidden?: boolean;
  kind?: 'act' | 'review-action';
}

export const DQ_CODE_PAGE_CONFIG = {
  pageId: 'dq-code-management',
  title: 'Data Quality Code Management',
  description: 'Review and manage regulatory data quality codes',
  defaultRegulation: 'wla',
  defaultMappingStatus: 'All' as const,
  filters: [
    { key: 'regulation', label: 'Regulation', options: ['All', 'wla', 'swxtr', 'm2tr', 'rhoo'] },
    { key: 'mappingStatus', label: 'Mapping Status', options: ['All', 'Mapped', 'Unmapped', 'GenAI'] }
  ] satisfies DqPageFilterConfig[],
  factsApi: {
    method: 'POST' as const,
    url: '/wiz/ods-fact-service/facts',
    request: { header: { regulation: 'wla', stream: 'inboxagentic' }, max_records: 10 }
  },
  reviewSave: { mode: 'mock' as const },
  gridConfigId: 'dq-code-management-grid',
  blockSize: 50,
  cacheBlockCount: 3
};

export const DQ_CODE_GRID_COLUMNS: DqGridColumnConfig[] = [
  { field: 'regulation', headerName: 'Regulation', minWidth: 110 },
  { field: 'dqType', headerName: 'DQ Type', minWidth: 120 },
  { field: 'regCode', headerName: 'Reg Code', minWidth: 180 },
  { field: 'desc', headerName: 'Reg Code Description', minWidth: 230 },
  { field: 'dataType', headerName: 'Data Type', minWidth: 110 },
  { field: 'mappingStatus', headerName: 'Mapping Status', minWidth: 130 },
  { field: 'globalCode', headerName: 'Global Code', minWidth: 170 },
  { field: 'globalDqDescription', headerName: 'Global DQ Description', minWidth: 230 },
  { field: 'primaryFieldName', headerName: 'Primary Field', minWidth: 160 },
  { field: 'confidenceScore', headerName: 'Confidence Score', minWidth: 140, hidden: true },
  { field: 'satisfactionScore', headerName: 'Satisfaction Score', minWidth: 150 },
  { field: 'act', headerName: 'Action', minWidth: 105, kind: 'act' },
  { field: 'reviewAction', headerName: 'Action', minWidth: 190, kind: 'review-action' },
  { field: 'comments', headerName: 'Comments', minWidth: 220, hidden: true },
  { field: 'createdBy', headerName: 'Created By', minWidth: 130, hidden: true },
  { field: 'createTs', headerName: 'Created TS', minWidth: 170, hidden: true },
  { field: 'activeFlag', headerName: 'Active Flag', minWidth: 110, hidden: true },
  { field: 'id', headerName: 'ID', minWidth: 180, hidden: true },
  { field: 'lastUpdatedBy', headerName: 'Last Updated By', minWidth: 140, hidden: true },
  { field: 'lastUpdateTs', headerName: 'Last Updated TS', minWidth: 170, hidden: true },
  { field: 'olympusRegulation', headerName: 'Olympus Regulation', minWidth: 160, hidden: true },
  { field: 'primaryField', headerName: 'Primary Field', minWidth: 150, hidden: true },
  { field: 'secondaryFieldNames', headerName: 'Secondary Field Names', minWidth: 200, hidden: true },
  { field: 'stream', headerName: 'Stream', minWidth: 120, hidden: true }
];

export const DQ_CODE_DEFAULT_COL_DEF: ColDef<DqCodeRecord> = {
  sortable: true, filter: true, resizable: true, minWidth: 110,
  wrapHeaderText: true, autoHeaderHeight: true
};