import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridApi, GridReadyEvent, RowClickedEvent, CellClickedEvent, ICellRendererParams } from 'ag-grid-community';
import { finalize } from 'rxjs/operators';
import pageConfig from './config/dq-code-management-page-config.json';
import { DqCodeManagementMockService } from './services/dq-code-management-mock.service';

const DQ_CODE_PAGE_CONFIG = pageConfig;
const DQ_CODE_GRID_COLUMNS = pageConfig.columns;
const DQ_CODE_DEFAULT_COL_DEF: ColDef = pageConfig.defaultColDef;

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

  regulation = DQ_CODE_PAGE_CONFIG.defaultRegulation;
  mappingStatus: 'All' | 'Mapped' | 'Unmapped' | 'GenAI' = DQ_CODE_PAGE_CONFIG.defaultMappingStatus;
  allRows: any[] = [];
  visibleRows: any[] = [];
  totalRecords = 0;
  loading = false;
  savingReview = false;
  errorMessage = '';
  notice = '';
  gridApi?: GridApi<any>;
  selectedRecord?: any;
  reviewRecord?: any;
  reviewDecision: 'APPROVED' | 'REJECTED' = 'APPROVED';
  reviewComment = '';

  readonly gridOptions = {
    animateRows: true,
    rowSelection: { mode: 'singleRow' as const, enableClickSelection: true },
    pagination: true,
    paginationPageSize: 50,
    paginationPageSizeSelector: [25, 50, 100],
    getRowId: (params: any) => params.data.id,
    onRowClicked: (event: RowClickedEvent<any>) => this.selectedRecord = event.data,
    onCellClicked: (event: CellClickedEvent<any>) => this.onCellClicked(event),
    overlayNoRowsTemplate: '<span class="dq-empty">No records match the selected filters.</span>'
  };

  constructor(private http: HttpClient, private reviewService: DqCodeManagementMockService) {
    this.loadFacts();
  }

  ngOnDestroy(): void {
    this.gridApi?.destroy();
  }

  get columnDefs(): ColDef<any>[] {
    return DQ_CODE_GRID_COLUMNS.map(column => {
      const definition: ColDef<any> = {
        field: column.field,
        colId: column.field,
        headerName: column.headerName,
        minWidth: column.minWidth,
        hide: !!column.hidden,
        sortable: !column.kind,
        filter: column.kind ? false : 'agTextColumnFilter',
        floatingFilter: !column.kind
      };

      if (column.kind === 'review-action') {
        definition.pinned = 'right';
        definition.cellRenderer = (params: ICellRendererParams<any>) =>
          params.data?.mappingStatus === 'GENAI'
            ? '<div class="dq-review-actions"><button class="dq-approve" data-decision="APPROVED">Approve</button><button class="dq-reject" data-decision="REJECTED">Reject</button></div>' : '';
      }

      if (column.field === 'status') {
        definition.cellRenderer = params => {
          const status = String(params.value || '');
          return `<span class="dq-status dq-status--${status.toLowerCase()}">${status}</span>`;
        };
      }
      if (column.field === 'satisfactionScore') {
        definition.valueFormatter = params => params.value == null ? '' : `${params.value}%`;
      }
      return definition;
    });
  }

  onGridReady(event: GridReadyEvent<any>): void {
    this.gridApi = event.api;
    this.applyFilters();
  }

  loadFacts(): void {
    this.loading = true;
    this.errorMessage = '';
    const request = {
      ...DQ_CODE_PAGE_CONFIG.factsApi.request,
      header: {
        ...DQ_CODE_PAGE_CONFIG.factsApi.request.header,
        regulation: this.regulation
      }
    };

    this.http.post<any>(DQ_CODE_PAGE_CONFIG.factsApi.url, request)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: response => {
          const containers = Array.isArray(response?.factContainers) ? response.factContainers : [];
          this.allRows = containers.map((item: any, index: number) =>
            this.mapFact(item?.dqInbox || item, index));
          this.totalRecords = Number(response?.totalRecords ?? this.allRows.length);
          this.applyFilters();
          if (!this.allRows.length) {
            this.errorMessage = 'No factContainers were returned. Check the Facts API response.';
          }
        },
        error: error => {
          this.allRows = [];
          this.totalRecords = 0;
          this.applyFilters();
          this.errorMessage = error?.message || 'Unable to load Facts records.';
        }
      });
  }

  private mapFact(raw: any, index: number): any {
    const value = (...keys: string[]) => {
      for (const key of keys) {
        if (raw?.[key] !== undefined && raw[key] !== null) return raw[key];
      }
      return '';
    };

    // The Facts API identifies an AI-generated mapping with the exact status
    // value "ai_mapped". Normalize it for the existing GenAI UI/filter behavior.
    const sourceStatus = String(value('status', 'mappingStatus')).trim().toLowerCase();
    const mappingStatus = sourceStatus === 'ai_mapped'
      ? 'GENAI'
      : sourceStatus === 'mapped'
        ? 'MAPPED'
        : sourceStatus === 'approved'
          ? 'APPROVED'
          : sourceStatus === 'rejected'
            ? 'REJECTED'
            : 'UNMAPPED';

    return {
      id: String(value('id') || `FACT-${index + 1}`),
      regulation: String(value('regulation') || this.regulation),
      olympusRegulation: String(value('olympusRegulation')),
      stream: String(value('stream') || 'inboxagentic'),
      dqType: String(value('dqType') || 'Exception'),
      regCode: String(value('regCode')),
      desc: String(value('desc', 'description')),
      dataType: String(value('dataType')),
      sourceStatus,
      mappingStatus,
      status: String(value('status')) || sourceStatus,
      globalCode: String(value('globalCode')),
      globalDqDescription: String(value('globalDqDescription', 'globalDqDesc')),
      primaryField: String(value('primaryField')),
      primaryFieldName: String(value('primaryFieldName', 'primaryField')),
      secondaryFieldNames: Array.isArray(value('secondaryFieldNames')) ? value('secondaryFieldNames') : [],
      confidenceScore: Number(value('confidenceScore')) || null,
      satisfactionScore: Number(value('satisfactionScore')) || null,
      activeFlag: String(value('activeFlag')),
      comments: String(value('comments')),
      createdBy: String(value('createdBy')),
      createTs: String(value('createTs')),
      lastUpdatedBy: String(value('lastUpdatedBy')),
      lastUpdateTs: String(value('lastUpdateTs'))
    };
  }

  onRegulationChange(): void {
    this.selectedRecord = undefined;
    this.gridApi?.deselectAll();
    this.loadFacts();
  }

  onFilterChange(): void {
    this.selectedRecord = undefined;
    this.gridApi?.deselectAll();
    this.applyFilters();
  }

  resetFilters(): void {
    this.regulation = DQ_CODE_PAGE_CONFIG.defaultRegulation;
    this.mappingStatus = DQ_CODE_PAGE_CONFIG.defaultMappingStatus;
    this.loadFacts();
  }

  private applyFilters(): void {
    this.visibleRows = this.allRows.filter(row => {
      if (this.mappingStatus === 'Mapped') return ['MAPPED', 'APPROVED'].includes(row.mappingStatus);
      if (this.mappingStatus === 'Unmapped') return row.mappingStatus === 'UNMAPPED';
      if (this.mappingStatus === 'GenAI') return row.mappingStatus === 'GENAI';
      return true;
    }).map(row => this.reviewService.getReviewedRecord(row.id) || row);

    this.gridApi?.setGridOption('rowData', this.visibleRows);
  }

  get selectedRecordEntries(): { key: string; value: any }[] {
    if (!this.selectedRecord) return [];
    return Object.entries(this.selectedRecord).map(([key, value]) => ({ key, value }));
  }

  private onCellClicked(event: CellClickedEvent<any>): void {
    if (!event.data) return;

    if (event.column.getColId() === 'reviewAction') {
      const button = (event.event?.target as HTMLElement)?.closest('button[data-decision]') as HTMLButtonElement | null;
      if (!button) return;
      this.reviewDecision = button.dataset['decision'] as 'APPROVED' | 'REJECTED';
      this.reviewRecord = event.data;
      this.reviewComment = '';
    }
  }

  sendReviewComment(): void {
    if (!this.reviewRecord || !this.reviewComment.trim() || this.savingReview) return;

    this.savingReview = true;
    this.reviewService.saveReview(this.reviewRecord, this.reviewDecision, this.reviewComment)
      .pipe(finalize(() => this.savingReview = false))
      .subscribe(updated => {
        this.reviewRecord = undefined;
        this.selectedRecord = updated;
        this.notice = 'Review saved in demo memory only. MongoDB integration is pending.';
        this.applyFilters();
      });
  }

  closeReview(): void {
    this.reviewRecord = undefined;
    this.reviewComment = '';
  }

  closeDetails(): void {
    this.selectedRecord = undefined;
  }
}