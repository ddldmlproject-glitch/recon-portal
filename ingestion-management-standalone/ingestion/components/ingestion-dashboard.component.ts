import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { themeQuartz } from 'ag-grid-community';
import type { ColDef, GridOptions } from 'ag-grid-community';
import { INGESTION_SCREEN_CONFIG } from '../config/ingestion-screen.config';
import type {
  IngestionDocument,
  IngestionFilter,
  IngestionStatus,
  UpdateIngestionDocumentCommand,
  UploadDocumentCommand
} from '../models/ingestion-document.model';
import { INGESTION_REPOSITORY } from '../services/ingestion.repository';
import type { IngestionRepository } from '../services/ingestion.repository';
import { IngestionMockRepository } from '../services/ingestion-mock.repository';

@Component({
  selector: 'ing-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, DatePipe],
  providers: [IngestionMockRepository, { provide: INGESTION_REPOSITORY, useExisting: IngestionMockRepository }],
  templateUrl: './ingestion-dashboard.component.html',
  styleUrl: './ingestion-dashboard.component.scss'
})
export class IngestionDashboardComponent implements OnInit {
  @Output() readonly close = new EventEmitter<void>();
  readonly config = INGESTION_SCREEN_CONFIG;
  private readonly repository = inject<IngestionRepository>(INGESTION_REPOSITORY);

  readonly documents = signal<IngestionDocument[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');
  readonly activeFilter = signal<IngestionFilter>('ALL');
  readonly uploadOpen = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly category = signal(this.config.upload.defaultCategory);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly selectedDocument = signal<IngestionDocument | null>(null);
  readonly editing = signal(false);
  readonly editCategory = signal('');
  readonly editDescription = signal('');
  readonly editError = signal('');
  readonly saving = signal(false);
  readonly deleteTarget = signal<IngestionDocument | null>(null);
  readonly removeReason = signal('Removed by user');
  readonly deleteError = signal('');
  readonly message = signal('');

  readonly metrics = computed(() => this.config.metrics.map(metric => ({
    ...metric,
    value: metric.id === 'total' ? this.documents().length
      : this.documents().filter(row => row.status === metric.status).length
  })));

  readonly filteredDocuments = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.documents().filter(row => {
      const statusMatches = this.activeFilter() === 'ALL' || row.status === this.activeFilter();
      const queryMatches = !query || [row.fileName, row.documentId, row.uploadedBy, row.documentCategory]
        .join(' ').toLowerCase().includes(query);
      return statusMatches && queryMatches;
    });
  });

  readonly columnDefs: ColDef<IngestionDocument>[] = [
    ...this.config.columns,
    {
      headerName: 'Actions',
      colId: 'actions',
      pinned: 'right',
      width: 156,
      minWidth: 156,
      maxWidth: 156,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: params => {
        if (!params.data || params.data.status === 'REMOVED') {
          return '<span class="ingestion-grid-action-muted">Removed</span>';
        }
        return `
          <div class="ingestion-grid-actions">
            <button type="button" class="ingestion-grid-action edit" data-ingestion-action="edit" aria-label="Edit record">Edit</button>
            <button type="button" class="ingestion-grid-action delete" data-ingestion-action="delete" aria-label="Delete record">Delete</button>
          </div>
        `;
      }
    }
  ];

  readonly gridOptions: GridOptions<IngestionDocument> = {
    rowHeight: 58,
    headerHeight: 42,
    animateRows: true,
    pagination: true,
    paginationPageSize: 10,
    paginationPageSizeSelector: [10, 20, 50],
    suppressCellFocus: true,
    onCellClicked: event => {
      if (event.colDef.colId !== 'actions' || !event.data) return;
      const target = event.event?.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.closest<HTMLButtonElement>('[data-ingestion-action]')?.dataset['ingestionAction'];
      if (!action) return;
      event.event?.stopPropagation();
      if (action === 'edit') this.openEdit(event.data);
      if (action === 'delete') this.openDelete(event.data);
    },
    onRowDoubleClicked: event => {
      if (event.data && event.data.status !== 'REMOVED') this.openDetails(event.data);
    }
  };

  readonly gridTheme = themeQuartz.withParams({ spacing: 7, fontSize: 12, borderRadius: 5, headerFontSize: 11 });

  async ngOnInit(): Promise<void> { await this.refresh(); }

  async refresh(): Promise<void> {
    this.loading.set(true);
    try { this.documents.set(await this.repository.getDocuments()); }
    catch (error) { this.notify(error instanceof Error ? error.message : 'Unable to load documents.'); }
    finally { this.loading.set(false); }
  }

  countFor(filter: IngestionFilter): number {
    return filter === 'ALL' ? this.documents().length : this.documents().filter(row => row.status === filter).length;
  }

  openUpload(): void {
    this.error.set('');
    this.selectedFile.set(null);
    this.category.set(this.config.upload.defaultCategory);
    this.uploadOpen.set(true);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.error.set('');
    if (!file) { this.selectedFile.set(null); return; }
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!this.config.upload.extensions.includes(extension)) {
      this.selectedFile.set(null);
      this.error.set(`Allowed file types: ${this.config.upload.extensions.join(', ').toUpperCase()}.`);
      input.value = '';
      return;
    }
    if (file.size > this.config.upload.maxSizeMb * 1024 * 1024) {
      this.selectedFile.set(null);
      this.error.set(`Maximum file size is ${this.config.upload.maxSizeMb} MB.`);
      input.value = '';
      return;
    }
    this.selectedFile.set(file);
  }

  async upload(): Promise<void> {
    const file = this.selectedFile();
    if (!file) { this.error.set('Choose a document first.'); return; }
    const command: UploadDocumentCommand = { file, uploadedBy: 'Kasturi (Demo User)', documentCategory: this.category() };
    this.busy.set(true);
    try {
      const created = await this.repository.uploadDocument(command);
      this.documents.update(rows => [created, ...rows]);
      this.uploadOpen.set(false);
      this.notify(`${created.fileName} added to the ingestion queue.`);
      if (this.repository instanceof IngestionMockRepository) {
        void this.repository.completeProcessing(created.documentId).then(() => this.refresh());
      }
    } catch (error) { this.error.set(error instanceof Error ? error.message : 'Upload failed.'); }
    finally { this.busy.set(false); }
  }

  openDetails(document: IngestionDocument): void {
    this.editing.set(false);
    this.selectedDocument.set(document);
  }

  openEdit(document: IngestionDocument): void {
    if (document.status === 'REMOVED') return;
    this.selectedDocument.set(document);
    this.editCategory.set(document.documentCategory);
    this.editDescription.set(document.description ?? '');
    this.editError.set('');
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.selectedDocument.set(null);
    this.editError.set('');
  }

  async saveEdit(): Promise<void> {
    const selected = this.selectedDocument();
    const documentCategory = this.editCategory().trim();
    const description = this.editDescription().trim();
    if (!selected) return;
    if (!documentCategory) {
      this.editError.set('Choose a document category.');
      return;
    }

    const command: UpdateIngestionDocumentCommand = { documentCategory, description };
    this.saving.set(true);
    this.editError.set('');
    try {
      const updated = await this.repository.updateDocument(selected.documentId, command);
      this.documents.update(rows => rows.map(row => row.documentId === updated.documentId ? updated : row));
      this.selectedDocument.set(updated);
      this.editing.set(false);
      this.notify(`${updated.fileName} updated successfully.`);
    } catch (error) {
      this.editError.set(error instanceof Error ? error.message : 'Unable to update this record.');
    } finally {
      this.saving.set(false);
    }
  }

  openDelete(document: IngestionDocument): void {
    if (document.status === 'REMOVED') return;
    this.deleteTarget.set(document);
    this.removeReason.set('Removed by user');
    this.deleteError.set('');
  }

  cancelDelete(): void {
    this.deleteTarget.set(null);
    this.deleteError.set('');
  }

  async confirmDelete(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;
    this.busy.set(true);
    this.deleteError.set('');
    try {
      const updated = await this.repository.removeDocument(
        target.documentId,
        this.removeReason().trim() || 'Removed by user'
      );
      this.documents.update(rows => rows.map(row => row.documentId === updated.documentId ? updated : row));
      this.deleteTarget.set(null);
      if (this.selectedDocument()?.documentId === updated.documentId) {
        this.selectedDocument.set(updated);
        this.editing.set(false);
      }
      this.notify(`${updated.fileName} marked as removed. Audit history is retained.`);
    } catch (error) {
      this.deleteError.set(error instanceof Error ? error.message : 'Unable to remove this record.');
    } finally {
      this.busy.set(false);
    }
  }

  statusLabel(status: IngestionStatus): string {
    return ({ INGESTED: 'Ingested', PROCESSING: 'Processing', FAILED: 'Failed', REMOVED: 'Removed' })[status];
  }

  private notify(message: string): void { this.message.set(message); }
}
