import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

type Mailbox = 'Inbox' | 'Starred' | 'Snoozed' | 'Important' | 'Sent' | 'Drafts' | 'Spam' | 'Trash';
interface RequestRecord {
  id: string; actionTool: string; actionType: string; requestStatus: string;
  sourceStatus: string; createdBy: string; details: string; comments: string;
  createdDate: string; actionedBy: string; actionComments: string;
  folder: Mailbox; unread: boolean; starred: boolean; important: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AgGridAngular],
  template: `
    <header class="topbar">
      <div class="brand-mark">R</div>
      <div class="brand-copy"><strong>Recon Portal</strong><span>OPERATIONS WORKSPACE</span></div>
      <div class="top-search"><span>⌕</span><input aria-label="Search all requests" placeholder="Search requests, IDs, comments..." (input)="globalSearch.set($any($event.target).value)"></div>
      <div class="top-actions">
        <button class="icon-button" aria-label="Help">?</button>
        <button class="notification-button" aria-label="Inbox notifications" (click)="showNotifications.set(!showNotifications())">
          <span class="bell">♧</span><span class="notification-dot" *ngIf="unreadCount() > 0"></span>
          <span class="count" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
        </button>
        <div class="avatar">KA</div>
      </div>
      <div class="notification-popover" *ngIf="showNotifications()">
        <strong>Notifications</strong><p>{{ unreadCount() }} unread requests need your attention.</p>
        <button class="text-action" (click)="selectFolder('Inbox'); showNotifications.set(false)">View inbox →</button>
      </div>
    </header>

    <div class="app-layout">
      <aside class="sidebar">
        <button class="compose" (click)="selectFolder('Drafts')"><span>＋</span> New request</button>
        <div class="nav-label">MAILBOX</div>
        <button *ngFor="let item of folders" class="nav-item" [class.active]="activeFolder() === item.name" (click)="selectFolder(item.name)">
          <span class="nav-icon">{{ item.icon }}</span><span class="nav-name">{{ item.name }}</span>
          <span class="nav-count" *ngIf="item.name === 'Inbox' && unreadCount()">{{ unreadCount() }}</span>
          <span class="nav-count" *ngIf="item.name === 'Drafts'">2</span>
        </button>
        <div class="sidebar-footer"><span class="status-dot"></span> Demo environment <span class="demo-pill">LOCAL</span></div>
      </aside>

      <main class="content">
        <div class="breadcrumb"><span>WORKSPACE</span><span class="crumb-slash">/</span><span>MAILBOX</span></div>
        <section class="page-heading">
          <div><div class="eyebrow">REQUEST MANAGEMENT</div><h1>{{ activeFolder() }}</h1><p>Review and manage operational requests in one place.</p></div>
          <div class="heading-actions"><button class="secondary-button" (click)="markAllRead()">✓ Mark all read</button><button class="primary-button" (click)="selectFolder('Drafts')">＋ Create request</button></div>
        </section>
        <section class="summary-strip">
          <div class="summary-card"><div class="summary-icon blue">▤</div><div><span>Total requests</span><strong>{{ visibleRows().length }}</strong></div></div>
          <div class="summary-card"><div class="summary-icon amber">◷</div><div><span>Awaiting approval</span><strong>{{ pendingCount() }}</strong></div></div>
          <div class="summary-card"><div class="summary-icon green">✓</div><div><span>Unread</span><strong>{{ unreadCount() }}</strong></div></div>
        </section>

        <section class="table-panel">
          <div class="table-toolbar">
            <div class="tabs"><button class="tab" [class.selected]="statusFilter() === 'All'" (click)="statusFilter.set('All')">All requests <span>{{ visibleRows().length }}</span></button><button class="tab" [class.selected]="statusFilter() === 'Pending'" (click)="statusFilter.set('Pending')">Awaiting approval</button></div>
            <div class="table-tools"><label class="grid-search"><span>⌕</span><input placeholder="Filter requests" [value]="gridSearch()" (input)="gridSearch.set($any($event.target).value)"></label><button class="square-button" title="Refresh sample data" (click)="refreshGrid()">↻</button></div>
          </div>
          <div class="grid-meta"><span><strong>{{ visibleRows().length }}</strong> requests <span class="meta-divider">·</span> Updated just now</span><span class="demo-note"><span class="status-dot"></span> Sample data</span></div>
          <div class="grid-wrap">
            <ag-grid-angular
              class="ag-theme-quartz recon-grid"
              [rowData]="visibleRows()"
              [columnDefs]="columnDefs"
              [defaultColDef]="defaultColDef"
              [rowSelection]="rowSelection"
              [animateRows]="true"
              [pagination]="true"
              [paginationPageSize]="10"
              [suppressCellFocus]="true"
              (gridReady)="onGridReady($event)"
              (rowClicked)="onRowClicked($event.data)">
            </ag-grid-angular>
          </div>
          <div class="panel-footer"><span>Showing <strong>{{ visibleRows().length }}</strong> sample records</span><span>Recon Portal <span class="footer-separator">•</span> Inbox module</span></div>
        </section>
        <footer class="page-footer">© 2026 Recon Portal <span>Enterprise request management</span><span class="local-tag">MOCK DATA · NO API CONNECTED</span></footer>
      </main>
    </div>

    <div class="drawer-backdrop" *ngIf="selectedRecord()" (click)="selectedRecord.set(null)"></div>
    <aside class="detail-drawer" *ngIf="selectedRecord() as record">
      <div class="drawer-head"><div><span class="eyebrow">REQUEST DETAILS</span><h2>{{ record.id }}</h2></div><button class="square-button" (click)="selectedRecord.set(null)">×</button></div>
      <span class="status-badge" [class.approved]="record.requestStatus === 'APPROVED'">{{ record.requestStatus }}</span>
      <h3>{{ record.actionType }} request</h3><p class="detail-description">{{ record.details }}</p>
      <div class="detail-list"><div><span>Action tool</span><strong>{{ record.actionTool }}</strong></div><div><span>Source status</span><strong>{{ record.sourceStatus }}</strong></div><div><span>Created by</span><strong>{{ record.createdBy }}</strong></div><div><span>Created date</span><strong>{{ record.createdDate }}</strong></div><div><span>Comments</span><strong>{{ record.comments || 'No comments' }}</strong></div></div>
      <div class="drawer-actions"><button class="secondary-button" (click)="toggleStar(record)">{{ record.starred ? '★ Starred' : '☆ Add star' }}</button><button class="primary-button" (click)="approve(record)" [disabled]="record.requestStatus === 'APPROVED'">Approve request</button><button class="danger-button" (click)="moveToTrash(record)">Move to trash</button></div>
    </aside>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  readonly folders: {name: Mailbox; icon: string}[] = [
    {name:'Inbox',icon:'▣'},{name:'Starred',icon:'☆'},{name:'Snoozed',icon:'◷'},{name:'Important',icon:'⚑'},
    {name:'Sent',icon:'➤'},{name:'Drafts',icon:'▱'},{name:'Spam',icon:'⊘'},{name:'Trash',icon:'♲'}
  ];
  readonly activeFolder = signal<Mailbox>('Inbox');
  readonly statusFilter = signal('All');
  readonly gridSearch = signal('');
  readonly globalSearch = signal('');
  readonly showNotifications = signal(false);
  readonly selectedRecord = signal<RequestRecord | null>(null);
  readonly records = signal<RequestRecord[]>([
    {id:'3066382',actionTool:'SUBMIT_NET',actionType:'SUBMIT_NET',requestStatus:'PENDING_APPROVAL',sourceStatus:'SUBMITTED',createdBy:'st30839',details:'Network submission request requires review.',comments:'submit net',createdDate:'10/26/2026 05:18 AM',actionedBy:'—',actionComments:'—',folder:'Inbox',unread:true,starred:false,important:true},
    {id:'3066371',actionTool:'EDIT_REQUEST',actionType:'EDIT',requestStatus:'PENDING_APPROVAL',sourceStatus:'IN_REVIEW',createdBy:'st29418',details:'Department access information update.',comments:'Please review department changes.',createdDate:'10/26/2026 04:42 AM',actionedBy:'—',actionComments:'—',folder:'Inbox',unread:true,starred:true,important:false},
    {id:'3066294',actionTool:'SPLIT_NET',actionType:'SPLIT_UNSPLIT',requestStatus:'PENDING_APPROVAL',sourceStatus:'SUBMITTED',createdBy:'st30127',details:'Split/unsplit request submitted for approval.',comments:'Split request',createdDate:'10/25/2026 03:26 PM',actionedBy:'—',actionComments:'—',folder:'Inbox',unread:true,starred:false,important:false},
    {id:'3066118',actionTool:'CATEGORY_UPDATE',actionType:'CATEGORY_REASON',requestStatus:'APPROVED',sourceStatus:'COMPLETED',createdBy:'st27642',details:'Category and reason code update completed.',comments:'Updated as requested.',createdDate:'10/24/2026 11:03 AM',actionedBy:'st30839',actionComments:'Approved',folder:'Sent',unread:false,starred:false,important:false},
    {id:'3066092',actionTool:'DELETE_REQUEST',actionType:'DELETE',requestStatus:'PENDING_APPROVAL',sourceStatus:'SUBMITTED',createdBy:'st31882',details:'Delete request is waiting for reviewer action.',comments:'Delete request',createdDate:'10/24/2026 09:37 AM',actionedBy:'—',actionComments:'—',folder:'Inbox',unread:false,starred:false,important:true}
  ]);
  readonly unreadCount = computed(() => this.records().filter(r => r.folder !== 'Trash' && r.unread).length);
  readonly pendingCount = computed(() => this.visibleRows().filter(r => r.requestStatus === 'PENDING_APPROVAL').length);
  readonly visibleRows = computed(() => {
    const folder = this.activeFolder();
    const query = (this.gridSearch() || this.globalSearch()).toLowerCase().trim();
    return this.records().filter(r => {
      const inFolder = folder === 'Inbox' ? r.folder === 'Inbox' : folder === 'Starred' ? r.starred : folder === 'Important' ? r.important : r.folder === folder;
      const inStatus = this.statusFilter() === 'All' || r.requestStatus === 'PENDING_APPROVAL';
      const text = [r.id,r.actionTool,r.actionType,r.requestStatus,r.sourceStatus,r.createdBy,r.details,r.comments].join(' ').toLowerCase();
      return inFolder && inStatus && (!query || text.includes(query));
    });
  });
  readonly defaultColDef: ColDef = { sortable:true, filter:true, resizable:true, minWidth:115, flex:1 };
  readonly columnDefs: ColDef[] = [
    {headerName:'Request ID',field:'id',minWidth:115,checkboxSelection:false,cellClass:'request-id-cell'},
    {headerName:'Action Tool',field:'actionTool',minWidth:135},
    {headerName:'Action Type',field:'actionType',minWidth:130},
    {headerName:'Request Status',field:'requestStatus',minWidth:165,cellRenderer:(p:any)=>'<span class="grid-status '+(p.value==='APPROVED'?'status-approved':'status-pending')+'">'+String(p.value).replaceAll('_',' ')+'</span>'},
    {headerName:'Source Status',field:'sourceStatus',minWidth:125},
    {headerName:'Created By',field:'createdBy',minWidth:110},
    {headerName:'Details',field:'details',minWidth:220},
    {headerName:'Comments',field:'comments',minWidth:175},
    {headerName:'Created Date',field:'createdDate',minWidth:180},
    {headerName:'Actioned By',field:'actionedBy',minWidth:110},
    {headerName:'Action Comments',field:'actionComments',minWidth:160}
  ];
  readonly rowSelection = 'single' as const;
  private gridApi: any;

  onGridReady(event: GridReadyEvent) { this.gridApi = event.api; }
  refreshGrid() { this.gridApi?.refreshCells({force:true}); }
  selectFolder(folder: Mailbox) { this.activeFolder.set(folder); this.statusFilter.set('All'); this.gridSearch.set(''); }
  onRowClicked(record: RequestRecord) { this.selectedRecord.set(record); if (record.unread) this.updateRecord(record.id,{unread:false}); }
  markAllRead() { this.records.update(rows => rows.map(r => ({...r,unread:false}))); }
  toggleStar(record: RequestRecord) { this.updateRecord(record.id,{starred:!record.starred}); this.selectedRecord.set({...record,starred:!record.starred}); }
  approve(record: RequestRecord) { this.updateRecord(record.id,{requestStatus:'APPROVED',actionedBy:'You',actionComments:'Approved'}); this.selectedRecord.set({...record,requestStatus:'APPROVED',actionedBy:'You',actionComments:'Approved'}); }
  moveToTrash(record: RequestRecord) { if (!confirm('Move request '+record.id+' to Trash?')) return; this.updateRecord(record.id,{folder:'Trash',unread:false}); this.selectedRecord.set(null); }
  private updateRecord(id:string, patch:Partial<RequestRecord>) { this.records.update(rows => rows.map(r => r.id === id ? {...r,...patch} : r)); }
}
