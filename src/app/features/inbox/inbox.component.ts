import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, ModuleRegistry, ClientSideRowModelModule } from 'ag-grid-community';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

type Mailbox = 'Inbox' | 'Starred' | 'Snoozed' | 'Important' | 'Sent' | 'Drafts' | 'Spam' | 'Trash';
type RequestCategory = 'ALL' | 'MATCH_CLOSE' | 'EDIT' | 'DEPARTMENT' | 'NET' | 'DELETE' | 'SPLIT_UNSPLIT' | 'CATEGORY_REASON';
type RequestScope = 'ALL' | 'MINE' | 'AWAITING_APPROVAL';
interface RequestTabConfig { id: RequestCategory; label: string; enabled: boolean; order: number; }
interface RequestRecord {
  id: string; actionTool: string; actionType: string; requestStatus: string;
  sourceStatus: string; createdBy: string; details: string; comments: string;
  createdDate: string; actionedBy: string; actionComments: string;
  folder: Mailbox; unread: boolean; starred: boolean; important: boolean; category: RequestCategory;
}

@Component({
  selector: 'app-inbox',
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
      <nav class="mailbox-nav" aria-label="Mailbox folders">
        <div class="mailbox-nav-label">MAILBOX</div>
        <div class="mailbox-nav-items">
          <button class="compose" (click)="openCreateRequest()"><span>＋</span> New request</button>
          <button *ngFor="let item of folders" class="nav-item" [class.active]="activeFolder() === item.name" (click)="selectFolder(item.name)">
            <span class="nav-icon">{{ item.icon }}</span><span class="nav-name">{{ item.name }}</span>
            <span class="nav-count" *ngIf="item.name === 'Inbox' && unreadCount()">{{ unreadCount() }}</span>
            <span class="nav-count" *ngIf="item.name === 'Drafts'">2</span>
          </button>
        </div>
        <div class="sidebar-footer"><span class="status-dot"></span> Demo environment <span class="demo-pill">LOCAL</span></div>
      </nav>

      <main class="content">
        <div class="breadcrumb"><span>WORKSPACE</span><span class="crumb-slash">/</span><span>MAILBOX</span></div>
        <section class="page-heading">
          <div><div class="eyebrow">REQUEST MANAGEMENT</div><h1>{{ activeFolder() }}</h1><p>Review and manage operational requests in one place.</p></div>
          <div class="heading-actions"><button class="secondary-button" (click)="markAllRead()">✓ Mark all read</button><button class="primary-button" (click)="openCreateRequest()">＋ Create request</button></div>
        </section>
        <section class="request-tabs" aria-label="Request categories">
          <button *ngFor="let tab of requestTabs()" type="button" class="request-tab" [class.selected]="selectedRequestTab() === tab.id" (click)="selectRequestTab(tab.id)">
            {{ tab.label }} <span class="request-tab-count" *ngIf="tab.id === 'ALL'">{{ filteredCategoryCount() }}</span>
          </button>
        </section>
        <section class="summary-strip">
          <div class="summary-card"><div class="summary-icon blue">▤</div><div><span>Total requests</span><strong>{{ visibleRows().length }}</strong></div></div>
          <div class="summary-card"><div class="summary-icon amber">◷</div><div><span>Awaiting approval</span><strong>{{ pendingCount() }}</strong></div></div>
          <div class="summary-card"><div class="summary-icon green">✓</div><div><span>Unread</span><strong>{{ unreadCount() }}</strong></div></div>
        </section>

        <section class="table-panel">
          <div class="table-toolbar">
            <div class="request-scopes" role="radiogroup" aria-label="Filter requests">
              <label class="scope-option"><input type="radio" name="requestScope" value="ALL" [checked]="requestScope() === 'ALL'" (change)="setRequestScope('ALL')"><span>All</span></label>
              <label class="scope-option"><input type="radio" name="requestScope" value="MINE" [checked]="requestScope() === 'MINE'" (change)="setRequestScope('MINE')"><span>My Requests</span></label>
              <label class="scope-option"><input type="radio" name="requestScope" value="AWAITING_APPROVAL" [checked]="requestScope() === 'AWAITING_APPROVAL'" (change)="setRequestScope('AWAITING_APPROVAL')"><span>Awaiting Approval</span></label>
              <span class="scope-total">Total: {{ visibleRows().length }}</span>
            </div>
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

    <div class="modal-backdrop" *ngIf="createRequestOpen()" (click)="closeCreateRequest()">
      <section class="create-modal" role="dialog" aria-modal="true" aria-labelledby="create-request-title" (click)="$event.stopPropagation()">
        <div class="drawer-head"><div><span class="eyebrow">REQUEST MANAGEMENT</span><h2 id="create-request-title">Create request</h2></div><button type="button" class="square-button" aria-label="Close form" (click)="closeCreateRequest()">×</button></div>
        <p class="form-intro">Enter the request details below. This demo saves the request locally in the inbox.</p>
        <form class="request-form" (submit)="submitCreateRequest($event)">
          <label>Action type <span>*</span><select required [value]="newActionType()" (change)="newActionType.set($any($event.target).value)"><option value="SUBMIT_NET">SUBMIT_NET</option><option value="EDIT">EDIT</option><option value="SPLIT_UNSPLIT">SPLIT_UNSPLIT</option><option value="CATEGORY_REASON">CATEGORY_REASON</option><option value="DELETE">DELETE</option></select></label>
          <label>Action tool <span>*</span><input required [value]="newActionTool()" (input)="newActionTool.set($any($event.target).value)" placeholder="e.g. SUBMIT_NET"></label>
          <label>Created by <span>*</span><input required [value]="newCreatedBy()" (input)="newCreatedBy.set($any($event.target).value)" placeholder="Enter user ID"></label>
          <label>Details <span>*</span><textarea required rows="3" [value]="newDetails()" (input)="newDetails.set($any($event.target).value)" placeholder="Describe the request"></textarea></label>
          <label>Comments <textarea rows="2" [value]="newComments()" (input)="newComments.set($any($event.target).value)" placeholder="Add optional comments"></textarea></label>
          <div class="form-actions"><button type="button" class="secondary-button" (click)="closeCreateRequest()">Cancel</button><button type="submit" class="primary-button">Create request</button></div>
        </form>
      </section>
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
  styleUrls: ['./inbox.component.scss']
})
export class InboxComponent {
  readonly folders: {name: Mailbox; icon: string}[] = [
    {name:'Inbox',icon:'▣'},{name:'Starred',icon:'☆'},{name:'Snoozed',icon:'◷'},{name:'Important',icon:'⚑'},
    {name:'Sent',icon:'➤'},{name:'Drafts',icon:'▱'},{name:'Spam',icon:'⊘'},{name:'Trash',icon:'♲'}
  ];
  readonly activeFolder = signal<Mailbox>('Inbox');
  // Backend-shaped configuration: replace this seed with GET /api/inbox/request-tabs when the API is available.
  readonly requestTabs = signal<RequestTabConfig[]>([
    {id:'ALL',label:'All Requests',enabled:true,order:0},
    {id:'MATCH_CLOSE',label:'Match/Close Requests',enabled:true,order:1},
    {id:'EDIT',label:'Edit Requests',enabled:true,order:2},
    {id:'DEPARTMENT',label:'Department Requests',enabled:true,order:3},
    {id:'NET',label:'Net Requests',enabled:true,order:4},
    {id:'DELETE',label:'Delete Requests',enabled:true,order:5},
    {id:'SPLIT_UNSPLIT',label:'Split/Unsplit Requests',enabled:true,order:6},
    {id:'CATEGORY_REASON',label:'Category/Reason Code Requests',enabled:true,order:7}
  ]);
  readonly selectedRequestTab = signal<RequestCategory>('ALL');
  readonly statusFilter = signal('All');
  readonly requestScope = signal<RequestScope>('AWAITING_APPROVAL');
  // Demo identity; replace with the authenticated user from the future identity/session API.
  readonly currentUserId = signal('st30839');
  readonly gridSearch = signal('');
  readonly globalSearch = signal('');
  readonly showNotifications = signal(false);
  readonly createRequestOpen = signal(false);
  readonly newActionType = signal('SUBMIT_NET');
  readonly newActionTool = signal('SUBMIT_NET');
  readonly newCreatedBy = signal('');
  readonly newDetails = signal('');
  readonly newComments = signal('');
  readonly selectedRecord = signal<RequestRecord | null>(null);
  readonly records = signal<RequestRecord[]>([
    {id:'3066382',actionTool:'SUBMIT_NET',actionType:'SUBMIT_NET',requestStatus:'PENDING_APPROVAL',sourceStatus:'SUBMITTED',createdBy:'st30839',details:'Network submission request requires review.',comments:'submit net',createdDate:'10/26/2026 05:18 AM',actionedBy:'—',actionComments:'—',folder:'Inbox',unread:true,starred:false,important:true,category:'NET'},
    {id:'3066371',actionTool:'EDIT_REQUEST',actionType:'EDIT',requestStatus:'PENDING_APPROVAL',sourceStatus:'IN_REVIEW',createdBy:'st29418',details:'Department access information update.',comments:'Please review department changes.',createdDate:'10/26/2026 04:42 AM',actionedBy:'—',actionComments:'—',folder:'Inbox',unread:true,starred:true,important:false,category:'EDIT'},
    {id:'3066294',actionTool:'SPLIT_NET',actionType:'SPLIT_UNSPLIT',requestStatus:'PENDING_APPROVAL',sourceStatus:'SUBMITTED',createdBy:'st30127',details:'Split/unsplit request submitted for approval.',comments:'Split request',createdDate:'10/25/2026 03:26 PM',actionedBy:'—',actionComments:'—',folder:'Inbox',unread:true,starred:false,important:false,category:'SPLIT_UNSPLIT'},
    {id:'3066118',actionTool:'CATEGORY_UPDATE',actionType:'CATEGORY_REASON',requestStatus:'APPROVED',sourceStatus:'COMPLETED',createdBy:'st27642',details:'Category and reason code update completed.',comments:'Updated as requested.',createdDate:'10/24/2026 11:03 AM',actionedBy:'st30839',actionComments:'Approved',folder:'Sent',unread:false,starred:false,important:false,category:'CATEGORY_REASON'},
    {id:'3066092',actionTool:'DELETE_REQUEST',actionType:'DELETE',requestStatus:'PENDING_APPROVAL',sourceStatus:'SUBMITTED',createdBy:'st31882',details:'Delete request is waiting for reviewer action.',comments:'Delete request',createdDate:'10/24/2026 09:37 AM',actionedBy:'—',actionComments:'—',folder:'Inbox',unread:false,starred:false,important:true,category:'DELETE'}
  ]);
  readonly unreadCount = computed(() => this.records().filter(r => r.folder !== 'Trash' && r.unread).length);
  readonly pendingCount = computed(() => this.visibleRows().filter(r => r.requestStatus === 'PENDING_APPROVAL').length);
  readonly filteredCategoryCount = computed(() => this.records().filter(r => this.activeFolder() === 'Inbox' ? r.folder === 'Inbox' : this.activeFolder() === 'Starred' ? r.starred : this.activeFolder() === 'Important' ? r.important : r.folder === this.activeFolder()).filter(r => this.selectedRequestTab() === 'ALL' || r.category === this.selectedRequestTab()).length);
  readonly visibleRows = computed(() => {
    const folder = this.activeFolder();
    const query = (this.gridSearch() || this.globalSearch()).toLowerCase().trim();
    return this.records().filter(r => {
      const inFolder = folder === 'Inbox' ? r.folder === 'Inbox' : folder === 'Starred' ? r.starred : folder === 'Important' ? r.important : r.folder === folder;
      const inCategory = this.selectedRequestTab() === 'ALL' || r.category === this.selectedRequestTab();
      const scope = this.requestScope();
      const inScope = scope === 'ALL'
        ? true
        : scope === 'MINE'
          ? r.createdBy.toLowerCase() === this.currentUserId().toLowerCase()
          : r.requestStatus === 'PENDING_APPROVAL';
      const inStatus = this.statusFilter() === 'All' || r.requestStatus === 'PENDING_APPROVAL';
      const text = [r.id,r.actionTool,r.actionType,r.requestStatus,r.sourceStatus,r.createdBy,r.details,r.comments].join(' ').toLowerCase();
      return inFolder && inCategory && inScope && inStatus && (!query || text.includes(query));
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

  openCreateRequest() {
    this.newActionType.set('SUBMIT_NET');
    this.newActionTool.set('SUBMIT_NET');
    this.newCreatedBy.set('');
    this.newDetails.set('');
    this.newComments.set('');
    this.createRequestOpen.set(true);
  }
  closeCreateRequest() { this.createRequestOpen.set(false); }
  submitCreateRequest(event: Event) {
    event.preventDefault();
    const now = new Date();
    const id = String(Math.max(3066400, ...this.records().map(r => Number(r.id) || 0)) + 1);
    const actionType = this.newActionType();
    const record: RequestRecord = {
      id, actionTool: this.newActionTool().trim() || actionType, actionType,
      requestStatus: 'PENDING_APPROVAL', sourceStatus: 'SUBMITTED',
      createdBy: this.newCreatedBy().trim(), details: this.newDetails().trim(),
      comments: this.newComments().trim(), createdDate: now.toLocaleString(),
      actionedBy: '—', actionComments: '—', folder: 'Inbox',
      unread: true, starred: false, important: false, category: this.categoryForAction(actionType)
    };
    this.records.update(rows => [record, ...rows]);
    this.activeFolder.set('Inbox');
    this.statusFilter.set('All');
    this.gridSearch.set('');
    this.globalSearch.set('');
    this.createRequestOpen.set(false);
    this.selectedRecord.set(record);
  }
  onGridReady(event: GridReadyEvent) { this.gridApi = event.api; }
  refreshGrid() { this.gridApi?.refreshCells({force:true}); }
  selectFolder(folder: Mailbox) { this.activeFolder.set(folder); this.selectedRequestTab.set('ALL'); this.statusFilter.set('All'); this.gridSearch.set(''); }
  selectRequestTab(category: RequestCategory) { this.selectedRequestTab.set(category); this.gridSearch.set(''); }
  setRequestScope(scope: RequestScope) { this.requestScope.set(scope); this.statusFilter.set('All'); this.gridSearch.set(''); }
  private categoryForAction(actionType: string): RequestCategory {
    const value = actionType.toUpperCase();
    if (value.includes('EDIT')) return 'EDIT';
    if (value.includes('DEPARTMENT')) return 'DEPARTMENT';
    if (value.includes('NET')) return 'NET';
    if (value.includes('DELETE')) return 'DELETE';
    if (value.includes('SPLIT')) return 'SPLIT_UNSPLIT';
    if (value.includes('CATEGORY') || value.includes('REASON')) return 'CATEGORY_REASON';
    if (value.includes('MATCH') || value.includes('CLOSE')) return 'MATCH_CLOSE';
    return 'ALL';
  }
  onRowClicked(record: RequestRecord) { this.selectedRecord.set(record); if (record.unread) this.updateRecord(record.id,{unread:false}); }
  markAllRead() { this.records.update(rows => rows.map(r => ({...r,unread:false}))); }
  toggleStar(record: RequestRecord) { this.updateRecord(record.id,{starred:!record.starred}); this.selectedRecord.set({...record,starred:!record.starred}); }
  approve(record: RequestRecord) { this.updateRecord(record.id,{requestStatus:'APPROVED',actionedBy:'You',actionComments:'Approved'}); this.selectedRecord.set({...record,requestStatus:'APPROVED',actionedBy:'You',actionComments:'Approved'}); }
  moveToTrash(record: RequestRecord) { if (!confirm('Move request '+record.id+' to Trash?')) return; this.updateRecord(record.id,{folder:'Trash',unread:false}); this.selectedRecord.set(null); }
  private updateRecord(id:string, patch:Partial<RequestRecord>) { this.records.update(rows => rows.map(r => r.id === id ? {...r,...patch} : r)); }
}
