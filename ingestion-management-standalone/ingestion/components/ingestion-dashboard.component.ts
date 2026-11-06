import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { themeQuartz } from 'ag-grid-community';
import type { GridOptions } from 'ag-grid-community';
import { INGESTION_SCREEN_CONFIG } from '../config/ingestion-screen.config';
import type { IngestionDocument, IngestionFilter, IngestionStatus, UploadDocumentCommand } from '../models/ingestion-document.model';
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
  readonly removeReason = signal('Uploaded by mistake');
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

  readonly gridOptions: GridOptions<IngestionDocument> = {
    rowHeight: 58, headerHeight: 42, animateRows: true, pagination: true,
    paginationPageSize: 10, paginationPageSizeSelector: [10, 20, 50],
    suppressCellFocus: true,
    onRowDoubleClicked: event => { if (event.data) this.selectedDocument.set(event.data); }
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

  async removeSelected(): Promise<void> {
    const selected = this.selectedDocument();
    if (!selected || selected.status === 'REMOVED') return;
    this.busy.set(true);
    try {
      const updated = await this.repository.removeDocument(selected.documentId, this.removeReason().trim() || 'Removed by user');
      this.documents.update(rows => rows.map(row => row.documentId === updated.documentId ? updated : row));
      this.selectedDocument.set(updated);
      this.notify(`${updated.fileName} marked as removed.`);
    } catch (error) { this.notify(error instanceof Error ? error.message : 'Remove failed.'); }
    finally { this.busy.set(false); }
  }

  statusLabel(status: IngestionStatus): string {
    return ({ INGESTED: 'Ingested', PROCESSING: 'Processing', FAILED: 'Failed', REMOVED: 'Removed' })[status];
  }

  private notify(message: string): void { this.message.set(message); }
}
