import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridApi, GridReadyEvent, IDatasource, IGetRowsParams, RowClickedEvent, CellClickedEvent } from 'ag-grid-community';
import { DQ_CODE_DEFAULT_COL_DEF, DQ_CODE_GRID_COLUMNS, DQ_CODE_PAGE_CONFIG } from './config/dq-code-management.config';
import { DqCodeManagementMockService } from './services/dq-code-management-mock.service';
import type { DqCodeFilter, DqCodeRecord, DqReviewRequest } from './models/dq-code-management.model';

@Component({
  selector: 'app-dq-code-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './dq-code-management.component.html',
  styleUrl: './dq-code-management.component.scss'
})
export class DqCodeManagementComponent implements OnInit, OnDestroy {
  readonly pageConfig = DQ_CODE_PAGE_CONFIG;
  readonly defaultColDef = DQ_CODE_DEFAULT_COL_DEF;
  readonly pageSize = DQ_CODE_PAGE_CONFIG.blockSize;
  mappingStatus: DqCodeFilter['mappingStatus'] = DQ_CODE_PAGE_CONFIG.defaultMappingStatus;
  regulation = 'All';
  dataType = 'All';
  gridApi?: GridApi<DqCodeRecord>;
  selectedRecord?: DqCodeRecord;
  reviewRecord?: DqCodeRecord;
  reviewDecision: 'APPROVED' | 'REJECTED' = 'APPROVED';
  reviewComment = '';
  busyRecordId: string | null = null;
  notice = '';

  readonly gridOptions = {
    rowModelType: 'infinite' as const,
    cacheBlockSize: DQ_CODE_PAGE_CONFIG.blockSize,
    maxBlocksInCache: DQ_CODE_PAGE_CONFIG.cacheBlockCount,
    rowSelection: { mode: 'singleRow' as const, enableClickSelection: true },
    animateRows: true,
    suppressCellFocus: false,
    getRowId: (params: { data: DqCodeRecord }) => params.data.id,
    onRowClicked: (event: RowClickedEvent<DqCodeRecord>) => this.onRowClicked(event),
    onCellClicked: (event: CellClickedEvent<DqCodeRecord>) => this.onCellClicked(event),
    overlayNoRowsTemplate: '<span class="dq-empty">No records match the selected filters.</span>'
  };

  constructor(private readonly data: DqCodeManagementMockService) {}

  ngOnInit(): void {}
  ngOnDestroy(): void { this.gridApi?.destroy(); }

  get columnDefs(): ColDef<DqCodeRecord>[] {
    return DQ_CODE_GRID_COLUMNS.map(config => {
      const col: ColDef<DqCodeRecord> = {
        field: config.field as keyof DqCodeRecord,
        colId: String(config.field),
        headerName: config.headerName,
        minWidth: config.minWidth,
        hide: !!config.hidden,
        sortable: config.kind === 'act' || config.kind === 'review-action' ? false : true,
        filter: config.kind === 'act' || config.kind === 'review-action' ? false : true
      };
      if (config.kind === 'act') {
        col.cellRenderer = (p: ICellRendererParams<DqCodeRecord>) => p.data?.mappingStatus === 'UNMAPPED'
          ? '<button class="dq-act-button" type="button">ACT</button>' : '';
        col.pinned = 'right';
      }
      if (config.kind === 'review-action') {
        col.cellRenderer = (p: ICellRendererParams<DqCodeRecord>) => p.data?.mappingStatus === 'GENAI'
          ? '<div class="dq-review-actions"><button class="dq-approve" type="button" data-decision="APPROVED">Approve</button><button class="dq-reject" type="button" data-decision="REJECTED">Reject</button></div>' : '';
        col.pinned = 'right';
      }
      if (config.field === 'mappingStatus') {
        col.cellRenderer = (p: ICellRendererParams<DqCodeRecord>) => {
          const value = String(p.value ?? '');
          return `<span class="dq-status dq-status--${value.toLowerCase()}">${value}</span>`;
        };
      }
      if (config.field === 'satisfactionScore') col.valueFormatter = p => p.value == null ? '' : `${p.value}%`;
      if (config.field === 'secondaryFieldNames') col.valueFormatter = p => Array.isArray(p.value) ? p.value.join(', ') : '';
      return col;
    });
  }

  onGridReady(event: GridReadyEvent<DqCodeRecord>): void {
    this.gridApi = event.api;
    this.refreshRows();
  }

  onFilterChange(): void {
    this.selectedRecord = undefined;
    this.gridApi?.deselectAll();
    this.refreshRows();
  }

  resetFilters(): void {
    this.mappingStatus = 'Unmapped';
    this.regulation = 'All';
    this.dataType = 'All';
    this.onFilterChange();
  }

  private get filters(): DqCodeFilter {
    return { mappingStatus: this.mappingStatus, regulation: this.regulation, dataType: this.dataType };
  }

  private refreshRows(): void {
    if (!this.gridApi) return;
    const datasource: IDatasource = {
      getRows: (params: IGetRowsParams) => {
        this.data.getRows(params.startRow, params.endRow, this.filters).subscribe({
          next: result => params.successCallback(result.rows, result.lastRow),
          error: () => params.failCallback()
        });
      }
    };
    this.gridApi.setGridOption('datasource', datasource);
  }

  private onRowClicked(event: RowClickedEvent<DqCodeRecord>): void {
    this.selectedRecord = event.data ? { ...event.data } : undefined;
  }

  private onCellClicked(event: CellClickedEvent<DqCodeRecord>): void {
    if (!event.data) return;
    if (event.column.getColId() === 'act' && event.data.mappingStatus === 'UNMAPPED') {
      this.generate(event.data);
    }
    if (event.column.getColId() === 'reviewAction' && event.data.mappingStatus === 'GENAI') {
      const target = (event.event?.target as HTMLElement | null)?.closest('button[data-decision]') as HTMLButtonElement | null;
      if (target?.dataset['decision']) {
        this.reviewDecision = target.dataset['decision'] as 'APPROVED' | 'REJECTED';
        this.reviewRecord = { ...event.data };
        this.reviewComment = '';
      }
    }
  }

  private generate(record: DqCodeRecord): void {
    this.busyRecordId = record.id;
    this.notice = '';
    this.data.generateGenAi(record.id).subscribe({
      next: updated => {
        this.busyRecordId = null;
        this.notice = `GenAI values generated for ${updated.id}. Status changed to GENAI.`;
        this.refreshRows();
      },
      error: () => { this.busyRecordId = null; this.notice = 'Unable to generate GenAI values.'; }
    });
  }

  sendReviewComment(): void {
    if (!this.reviewRecord || !this.reviewComment.trim()) return;
    const request: DqReviewRequest = {
      recordId: this.reviewRecord.id, decision: this.reviewDecision, comment: this.reviewComment.trim()
    };
    this.data.submitReview(request).subscribe({
      next: updated => {
        this.reviewRecord = undefined;
        this.selectedRecord = { ...updated };
        this.notice = `${updated.id} was ${this.reviewDecision.toLowerCase()} with reviewer comments.`;
        this.refreshRows();
      },
      error: () => this.notice = 'Unable to submit the review.'
    });
  }

  closeReview(): void { this.reviewRecord = undefined; this.reviewComment = ''; }
  closeDetails(): void { this.selectedRecord = undefined; }
}
