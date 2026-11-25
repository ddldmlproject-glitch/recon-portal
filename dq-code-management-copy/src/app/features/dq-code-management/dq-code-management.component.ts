import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridApi, GridReadyEvent, RowClickedEvent, CellClickedEvent, ICellRendererParams } from 'ag-grid-community';
import { finalize } from 'rxjs/operators';
import { DQ_CODE_DEFAULT_COL_DEF, DQ_CODE_GRID_COLUMNS, DQ_CODE_PAGE_CONFIG } from './config/dq-code-management.config';
import { DqCodeManagementMockService } from './services/dq-code-management-mock.service';
import type { DqCodeFilter, DqCodeRecord, DqFactsResponse, DqReviewRequest, MappingStatus } from './models/dq-code-management.model';

@Component({
  selector: 'app-dq-code-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, AgGridAngular],
  templateUrl: './dq-code-management.component.html',
  styleUrl: './dq-code-management.component.scss'
})
export class DqCodeManagementComponent implements OnDestroy {
  readonly pageConfig = DQ_CODE_PAGE_CONFIG;
  readonly defaultColDef = DQ_CODE_DEFAULT_COL_DEF;
  mappingStatus: DqCodeFilter['mappingStatus'] = DQ_CODE_PAGE_CONFIG.defaultMappingStatus;
  regulation = DQ_CODE_PAGE_CONFIG.defaultRegulation;
  allRows: DqCodeRecord[] = [];
  visibleRows: DqCodeRecord[] = [];
  totalRecords = 0;
  loading = false;
  savingReview = false;
  errorMessage = '';
  gridApi?: GridApi<DqCodeRecord>;
  selectedRecord?: DqCodeRecord;
  reviewRecord?: DqCodeRecord;
  reviewDecision: 'APPROVED' | 'REJECTED' = 'APPROVED';
  reviewComment = '';
  notice = '';

  readonly gridOptions = {
    animateRows: true,
    rowSelection: { mode: 'singleRow' as const, enableClickSelection: true },
    pagination: true,
    paginationPageSize: 50,
    paginationPageSizeSelector: [25, 50, 100],
    getRowId: (params: { data: DqCodeRecord }) => params.data.id,
    onRowClicked: (event: RowClickedEvent<DqCodeRecord>) => this.onRowClicked(event),
    onCellClicked: (event: CellClickedEvent<DqCodeRecord>) => this.onCellClicked(event),
    overlayNoRowsTemplate: '<span class="dq-empty">No records match the selected filters.</span>'
  };

  constructor(private readonly http: HttpClient, private readonly reviewMock: DqCodeManagementMockService) {
    this.loadFacts();
  }

  ngOnDestroy(): void { this.gridApi?.destroy(); }

  get columnDefs(): ColDef<DqCodeRecord>[] {
    return DQ_CODE_GRID_COLUMNS.map(config => {
      const col: ColDef<DqCodeRecord> = {
        field: config.field as keyof DqCodeRecord, colId: String(config.field),
        headerName: config.headerName, minWidth: config.minWidth, hide: !!config.hidden,
        sortable: !config.kind, filter: config.kind ? false : 'agTextColumnFilter',
        floatingFilter: !config.kind, enableRowGroup: !config.kind, enablePivot: !config.kind, enableValue: !config.kind
      };
      if (config.kind === 'act') {
        col.cellRenderer = (p: ICellRendererParams<DqCodeRecord>) => p.data?.mappingStatus === 'UNMAPPED' ? '<button class="dq-act-button" type="button">ACT</button>' : '';
        col.pinned = 'right';
      }
      if (config.kind === 'review-action') {
        col.cellRenderer = (p: ICellRendererParams<DqCodeRecord>) => p.data?.mappingStatus === 'GENAI'
          ? '<div class="dq-review-actions"><button class="dq-approve" type="button" data-decision="APPROVED">Approve</button><button class="dq-reject" type="button" data-decision="REJECTED">Reject</button></div>' : '';
        col.pinned = 'right';
      }
      if (config.field === 'mappingStatus') col.cellRenderer = p => {
        const value = String(p.value ?? '');
        return `<span class="dq-status dq-status--${value.toLowerCase()}">${value}</span>`;
      };
      if (config.field === 'satisfactionScore') col.valueFormatter = p => p.value == null ? '' : `${p.value}%`;
      if (config.field === 'secondaryFieldNames') col.valueFormatter = p => Array.isArray(p.value) ? p.value.join(', ') : '';
      return col;
    });
  }

  get filters(): DqCodeFilter { return { mappingStatus: this.mappingStatus, regulation: this.regulation }; }

  onGridReady(event: GridReadyEvent<DqCodeRecord>): void { this.gridApi = event.api; this.applyFilters(); }

  loadFacts(): void {
    this.loading = true; this.errorMessage = ''; this.notice = '';
    const request = {
      ...DQ_CODE_PAGE_CONFIG.factsApi.request,
      header: { ...DQ_CODE_PAGE_CONFIG.factsApi.request.header, regulation: this.regulation === 'All' ? DQ_CODE_PAGE_CONFIG.defaultRegulation : this.regulation }
    };
    this.http.post<DqFactsResponse>(DQ_CODE_PAGE_CONFIG.factsApi.url, request).pipe(finalize(() => this.loading = false))
      .subscribe({
        next: response => {
          const containers = Array.isArray(response?.factContainers) ? response.factContainers : [];
          this.allRows = containers.map((container, index) => this.mapFact(container.dqInbox ?? container, index));
          this.totalRecords = Number(response?.totalRecords ?? this.allRows.length);
          this.applyFilters();
          if (!this.allRows.length) this.errorMessage = 'The Facts API returned no factContainers. Verify the configured request/response contract.';
        },
        error: error => { this.allRows = []; this.visibleRows = []; this.totalRecords = 0; this.applyFilters(); this.errorMessage = error?.message || 'Unable to load DQ records from the Facts API.'; }
      });
  }

  private mapFact(raw: Record<string, unknown>, index: number): DqCodeRecord {
    const get = (...keys: string[]): unknown => { for (const key of keys) if (raw[key] !== undefined && raw[key] !== null) return raw[key]; return ''; };
    const rawStatus = String(get('status', 'mappingStatus')).toUpperCase();
    const status: MappingStatus = rawStatus === 'MAPPED' || rawStatus === 'APPROVED' || rawStatus === 'REJECTED' || rawStatus === 'GENAI' ? rawStatus : 'UNMAPPED';
    const primary = String(get('primaryFieldName', 'primaryField'));
    const confidence = Number(get('confidenceScore'));
    return {
      id: String(get('id') || `FACT-${index + 1}`), regulation: String(get('regulation') || this.regulation),
      olympusRegulation: String(get('olympusRegulation') || get('regulation')), stream: String(get('stream') || 'inboxagentic'),
      dqType: String(get('dqType') || 'Exception'), regCode: String(get('regCode')), desc: String(get('desc', 'description')),
      dataType: String(get('dataType')), mappingStatus: status, globalCode: String(get('globalCode')),
      globalDqDescription: String(get('globalDqDescription', 'globalDqDesc')), primaryField: String(get('primaryField')),
      primaryFieldName: primary, secondaryFieldNames: Array.isArray(get('secondaryFieldNames')) ? get('secondaryFieldNames') as string[] : [],
      confidenceScore: Number.isFinite(confidence) ? confidence : null, satisfactionScore: Number.isFinite(Number(get('satisfactionScore'))) ? Number(get('satisfactionScore')) : null,
      activeFlag: String(get('activeFlag') || ''), comments: String(get('comments')), createdBy: String(get('createdBy')),
      createTs: String(get('createTs')), lastUpdatedBy: String(get('lastUpdatedBy')), lastUpdateTs: String(get('lastUpdateTs'))
    };
  }

  onRegulationChange(): void { this.selectedRecord = undefined; this.gridApi?.deselectAll(); this.loadFacts(); }\n  onFilterChange(): void { this.selectedRecord = undefined; this.gridApi?.deselectAll(); this.applyFilters(); }
  resetFilters(): void { this.mappingStatus = 'All'; this.regulation = DQ_CODE_PAGE_CONFIG.defaultRegulation; this.onFilterChange(); }
  private applyFilters(): void {
    this.visibleRows = this.allRows.filter(row =>
      (this.regulation === 'All' || row.regulation.toLowerCase() === this.regulation.toLowerCase()) &&
      (this.mappingStatus === 'All' ||
        (this.mappingStatus === 'Mapped' && (row.mappingStatus === 'MAPPED' || row.mappingStatus === 'APPROVED')) ||
        (this.mappingStatus === 'Unmapped' && row.mappingStatus === 'UNMAPPED') ||
        (this.mappingStatus === 'GenAI' && row.mappingStatus === 'GENAI'))
    ).map(row => this.reviewMock.getReviewedRecord(row.id) ?? row);
    if (this.gridApi) this.gridApi.setGridOption('rowData', this.visibleRows);
  }
  private onRowClicked(event: RowClickedEvent<DqCodeRecord>): void { this.selectedRecord = event.data ? { ...event.data } : undefined; }
  private onCellClicked(event: CellClickedEvent<DqCodeRecord>): void {
    if (!event.data) return;
    if (event.column.getColId() === 'act' && event.data.mappingStatus === 'UNMAPPED') {
      this.notice = 'ACT is a local placeholder. No API is called for unmapped records.';
    }
    if (event.column.getColId() === 'reviewAction' && event.data.mappingStatus === 'GENAI') {
      const target = (event.event?.target as HTMLElement | null)?.closest('button[data-decision]') as HTMLButtonElement | null;
      if (target?.dataset['decision']) {
        this.reviewDecision = target.dataset['decision'] as 'APPROVED' | 'REJECTED';
        this.reviewRecord = { ...event.data }; this.reviewComment = '';
      }
    }
  }
  sendReviewComment(): void {
    if (!this.reviewRecord || !this.reviewComment.trim() || this.savingReview) return;
    this.savingReview = true;
    const request: DqReviewRequest = { recordId: this.reviewRecord.id, decision: this.reviewDecision, comment: this.reviewComment.trim() };
    this.reviewMock.submitReview(this.reviewRecord, request).pipe(finalize(() => this.savingReview = false)).subscribe({
      next: updated => { this.reviewRecord = undefined; this.selectedRecord = { ...updated }; this.notice = `${updated.id} was ${request.decision.toLowerCase()} with reviewer comments (demo only; not persisted to MongoDB).`; this.applyFilters(); },
      error: () => this.notice = 'Unable to submit the review.'
    });
  }
  closeReview(): void { this.reviewRecord = undefined; this.reviewComment = ''; }
  closeDetails(): void { this.selectedRecord = undefined; }
}