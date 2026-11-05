import { CommonModule } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { EntitlementGroup } from '../grouping-approvals/grouping-approvals.models';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridOptions, ICellRendererParams, RowClickedEvent } from 'ag-grid-community';
import { themeQuartz } from 'ag-grid-community';

type Mailbox = 'Inbox' | 'Starred' | 'Snoozed' | 'Important' | 'Sent' | 'Drafts' | 'Spam' | 'Trash';
type RequestCategory = 'ALL' | 'MATCH_CLOSE' | 'EDIT' | 'DEPARTMENT' | 'NET' | 'DELETE' | 'SPLIT_UNSPLIT' | 'CATEGORY_REASON' | 'HITL_PENDING';
type RequestOwnerScope = 'GROUP' | 'MINE';
type RequestApprovalScope = 'ALL' | 'AWAITING_APPROVAL';
interface RequestTabConfig { id: RequestCategory; label: string; enabled: boolean; order: number; }
interface RequestRecord {
  id: string; actionTool: string; actionType: string; requestStatus: string; sourceStatus: string;
  createdBy: string; details: string; comments: string; createdDate: string; actionedBy: string; actionComments: string;
  folder: Mailbox; unread: boolean; starred: boolean; important: boolean; category: RequestCategory;
}
type NewRequestDraft = { actionType: string; actionTool: string; createdBy: string; details: string; comments: string };

@Component({ selector: 'app-inbox', standalone: true, imports: [CommonModule, FormsModule, AgGridAngular], templateUrl: './inbox.component.html', styleUrl: './inbox.component.scss' })
export class InboxComponent {
  readonly groups = input<EntitlementGroup[]>([]);
  readonly currentUserId = signal('sso0204');
  readonly demoUsers = [
    { id: 'sso0204', label: 'sso0204 — Group owner / approver' },
    { id: 'ys51579', label: 'ys51579 — Group approver' },
    { id: 'GR30775', label: 'GR30775 — Group member' },
    { id: 'SA30754', label: 'SA30754 — Group member' },
    { id: 'jr14112', label: 'jr14112 — Group member' },
    { id: 'ms25678', label: 'ms25678 — Group member' },
    { id: 'rk76239', label: 'rk76239 — Group member' },
    { id: 'sc98371', label: 'sc98371 — Group member' },
    { id: 's91333', label: 's91333 — Group owner' },
    { id: 'mk12001', label: 'mk12001 — Group member' },
    { id: 'mk12002', label: 'mk12002 — Group member' },
    { id: 'dm11327', label: 'dm11327 — Group owner' },
    { id: 'latam001', label: 'latam001 — Group member' },
    { id: 'st30814', label: 'st30814 — Pending group owner' },
    { id: 'ops1001', label: 'ops1001 — Pending group member' },
    { id: 'ops1002', label: 'ops1002 — Pending group member' }
  ];
  readonly folders: { name: Mailbox; icon: string }[] = [
    {name:'Inbox',icon:'▣'},{name:'Starred',icon:'☆'},{name:'Snoozed',icon:'◷'},{name:'Important',icon:'⚑'},
    {name:'Sent',icon:'➤'},{name:'Drafts',icon:'▱'},{name:'Spam',icon:'⊘'},{name:'Trash',icon:'♲'}
  ];
  readonly activeFolder = signal<Mailbox>('Inbox');
  readonly requestTabs = signal<RequestTabConfig[]>([
    {id:'ALL',label:'All',enabled:true,order:0},
    {id:'EDIT',label:'Edit Requests',enabled:true,order:1},
    {id:'DELETE',label:'Delete Requests',enabled:true,order:2},
    {id:'HITL_PENDING',label:'HITL Pending Requests',enabled:true,order:3}
  ]);
  readonly selectedRequestTab = signal<RequestCategory>('ALL');
  readonly requestOwnerScope = signal<RequestOwnerScope>('GROUP');
  readonly requestApprovalScope = signal<RequestApprovalScope>('AWAITING_APPROVAL');
  readonly currentGroupIds = computed(() => this.groups().filter(group => this.groupMemberIds(group).includes(this.currentUserId().trim().toLowerCase())).map(group => group.id));
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
    {id:'3066382',actionTool:'SUBMIT_NET',actionType:'SUBMIT_NET',requestStatus:'PENDING_APPROVAL',sourceStatus:'SUBMITTED',createdBy:'sso0204',details:'Network submission request requires review.',comments:'Submit net',createdDate:'11/05/2026 09:18 AM',actionedBy:'—',actionComments:'—',folder:'Inbox',unread:true,starred:false,important:true,category:'NET'},
    {id:'3066371',actionTool:'EDIT_REQUEST',actionType:'EDIT',requestStatus:'PENDING_APPROVAL',sourceStatus:'IN_REVIEW',createdBy:'GR30775',details:'Department access information update.',comments:'Please review department changes.',createdDate:'11/05/2026 08:42 AM',actionedBy:'—',actionComments:'—',folder:'Inbox',unread:true,starred:true,important:false,category:'EDIT'},
    {id:'3066294',actionTool:'SPLIT_NET',actionType:'SPLIT_UNSPLIT',requestStatus:'PENDING_APPROVAL',sourceStatus:'SUBMITTED',createdBy:'ops1001',details:'Split/unsplit request submitted for approval.',comments:'Split request',createdDate:'11/04/2026 03:26 PM',actionedBy:'—',actionComments:'—',folder:'Inbox',unread:true,starred:false,important:false,category:'NET'},
    {id:'3066118',actionTool:'CATEGORY_UPDATE',actionType:'CATEGORY_REASON',requestStatus:'APPROVED',sourceStatus:'COMPLETED',createdBy:'sso0204',details:'Category and reason code update completed.',comments:'Updated as requested.',createdDate:'11/04/2026 11:03 AM',actionedBy:'st30839',actionComments:'Approved',folder:'Sent',unread:false,starred:false,important:false,category:'ALL'},
    {id:'3066092',actionTool:'DELETE_REQUEST',actionType:'DELETE',requestStatus:'PENDING_APPROVAL',sourceStatus:'SUBMITTED',createdBy:'GR30775',details:'Delete request is waiting for reviewer action.',comments:'Delete request',createdDate:'11/03/2026 09:37 AM',actionedBy:'—',actionComments:'—',folder:'Inbox',unread:false,starred:false,important:true,category:'DELETE'}
  ]);
  readonly unreadCount = computed(() => this.records().filter(r => r.folder !== 'Trash' && r.unread).length);
  readonly visibleRows = computed(() => {
    const folder = this.activeFolder(); const query = (this.gridSearch() || this.globalSearch()).toLowerCase().trim();
    return this.records().filter(r => {
      const inFolder = folder === 'Inbox' ? r.folder === 'Inbox' : folder === 'Starred' ? r.starred : folder === 'Important' ? r.important : r.folder === folder;
      const inCategory = this.selectedRequestTab() === 'ALL' || r.category === this.selectedRequestTab() || (this.selectedRequestTab() === 'EDIT' && r.actionType.toUpperCase().includes('EDIT')) || (this.selectedRequestTab() === 'DELETE' && r.actionType.toUpperCase().includes('DELETE')) || (this.selectedRequestTab() === 'HITL_PENDING' && r.requestStatus.toUpperCase().includes('HITL_PENDING'));
      const inOwner = this.requestOwnerScope() === 'MINE'
        ? this.isSameUser(r.createdBy, this.currentUserId())
        : this.groupsForRequestCreator(r.createdBy).some(group => this.currentGroupIds().includes(group.id));
      const inApproval = this.requestApprovalScope() === 'ALL' || r.requestStatus === 'PENDING_APPROVAL';
      const text = [r.id,r.actionTool,r.actionType,r.requestStatus,r.sourceStatus,r.createdBy,r.details,r.comments].join(' ').toLowerCase();
      return inFolder && inCategory && inOwner && inApproval && (!query || text.includes(query));
    });
  });
  readonly pendingCount = computed(() => this.visibleRows().filter(r => r.requestStatus === 'PENDING_APPROVAL').length);
  readonly totalCount = computed(() => this.visibleRows().length);
  readonly defaultColDef: ColDef<RequestRecord> = { sortable:true, filter:true, resizable:true, minWidth:115, flex:1 };
  readonly columnDefs: ColDef<RequestRecord>[] = [
    {headerName:'Request ID',field:'id',minWidth:110,maxWidth:125,cellClass:'request-id-cell'},
    {headerName:'Action Tool',field:'actionTool',minWidth:130},
    {headerName:'Action Type',field:'actionType',minWidth:125},
    {headerName:'Request Status',field:'requestStatus',minWidth:160,cellRenderer:(p: ICellRendererParams<RequestRecord>) => `<span class="grid-status ${p.value==='APPROVED'?'status-approved':'status-pending'}">${String(p.value ?? '').replaceAll('_',' ')}</span>`},
    {headerName:'Source Status',field:'sourceStatus',minWidth:125},
    {headerName:'Created By',field:'createdBy',minWidth:110},
    {headerName:'Details',field:'details',minWidth:210,flex:2},
    {headerName:'Comments',field:'comments',minWidth:165,flex:1.5},
    {headerName:'Created Date',field:'createdDate',minWidth:165},
    {headerName:'Actioned By',field:'actionedBy',minWidth:105},
    {headerName:'Action Comments',field:'actionComments',minWidth:150,flex:1.3}
  ];
  readonly gridOptions: GridOptions<RequestRecord> = { animateRows:true, pagination:true, paginationPageSize:10, paginationPageSizeSelector:[10,20,50], rowHeight:48, headerHeight:42, suppressCellFocus:true, getRowClass:p => p.data?.unread ? 'request-row-unread' : '' };
  readonly gridTheme = themeQuartz.withParams({ spacing:7, fontSize:12, borderRadius:5, headerFontSize:11, rowHoverColor:'#f2f6ff' });
  setDemoUser(userId: string): void {
    const selectedUser = this.demoUsers.find(user => user.id === userId);
    if (!selectedUser) return;
    this.currentUserId.set(selectedUser.id);
    this.newCreatedBy.set(selectedUser.id);
    this.selectedRecord.set(null);
    this.gridSearch.set('');
    this.globalSearch.set('');
    this.requestOwnerScope.set('GROUP');
    this.requestApprovalScope.set('AWAITING_APPROVAL');
    this.activeFolder.set('Inbox');
  }
  setFolder(folder: Mailbox): void { this.activeFolder.set(folder); this.selectedRequestTab.set('ALL'); this.selectedRecord.set(null); this.gridSearch.set(''); }
  selectRequestTab(category: RequestCategory): void { this.selectedRequestTab.set(category); this.gridSearch.set(''); }
  setRequestOwnerScope(scope: RequestOwnerScope): void { this.requestOwnerScope.set(scope); this.gridSearch.set(''); }
  setRequestApprovalScope(scope: RequestApprovalScope): void { this.requestApprovalScope.set(scope); this.gridSearch.set(''); }
  markAllRead(): void { this.records.update(rows => rows.map(r => ({...r,unread:false}))); }
  openNotifications(): void { this.showNotifications.update(v => !v); }
  openCreateRequest(): void { this.newActionType.set('SUBMIT_NET'); this.newActionTool.set('SUBMIT_NET'); this.newCreatedBy.set(this.currentUserId()); this.newDetails.set(''); this.newComments.set(''); this.createRequestOpen.set(true); }
  closeCreateRequest(): void { this.createRequestOpen.set(false); }
  submitCreateRequest(event: Event): void {
    event.preventDefault(); const actionType=this.newActionType(); const id=String(Math.max(3066400,...this.records().map(r=>Number(r.id)||0))+1);
    const record: RequestRecord={id,actionTool:this.newActionTool().trim()||actionType,actionType,requestStatus:'PENDING_APPROVAL',sourceStatus:'SUBMITTED',createdBy:this.currentUserId().trim(),details:this.newDetails().trim(),comments:this.newComments().trim(),createdDate:new Date().toLocaleString(),actionedBy:'—',actionComments:'—',folder:'Inbox',unread:true,starred:false,important:false,category:this.categoryForAction(actionType)};
    this.records.update(rows=>[record,...rows]); this.activeFolder.set('Inbox'); this.selectedRequestTab.set('ALL'); this.requestApprovalScope.set('ALL'); this.createRequestOpen.set(false); this.selectedRecord.set(record);
  }
  rowClicked(event: RowClickedEvent<RequestRecord>): void { if(event.data) this.openRecord(event.data); }
  openRecord(record: RequestRecord): void { this.records.update(rows=>rows.map(r=>r.id===record.id?{...r,unread:false}:r)); this.selectedRecord.set({...record,unread:false}); }
  toggleStar(record: RequestRecord): void { this.updateRecord(record.id,{starred:!record.starred}); this.selectedRecord.update(v=>v?{...v,starred:!v.starred}:v); }
  toggleImportant(record: RequestRecord): void { this.updateRecord(record.id,{important:!record.important}); this.selectedRecord.update(v=>v?{...v,important:!v.important}:v); }
  canApprove(record: RequestRecord): boolean {
    if (record.requestStatus !== 'PENDING_APPROVAL' || this.isSameUser(record.createdBy, this.currentUserId())) return false;
    return this.groupsForRequestCreator(record.createdBy).some(group =>
      this.currentGroupIds().includes(group.id) && group.approvers.some(id => this.isSameUser(id, this.currentUserId()))
    );
  }
  approve(record: RequestRecord): void {
    if (!this.canApprove(record)) return;
    this.updateRecord(record.id,{requestStatus:'APPROVED',sourceStatus:'COMPLETED',actionedBy:this.currentUserId(),actionComments:'Approved'});
    this.selectedRecord.update(v=>v?{...v,requestStatus:'APPROVED',sourceStatus:'COMPLETED',actionedBy:this.currentUserId(),actionComments:'Approved'}:v);
  }
  reject(record: RequestRecord): void {
    if (!this.canApprove(record)) return;
    this.updateRecord(record.id,{requestStatus:'REJECTED',sourceStatus:'REJECTED',actionedBy:this.currentUserId(),actionComments:'Rejected'});
    this.selectedRecord.update(v=>v?{...v,requestStatus:'REJECTED',sourceStatus:'REJECTED',actionedBy:this.currentUserId(),actionComments:'Rejected'}:v);
  }
  moveToTrash(record: RequestRecord): void { if(!confirm(`Move request ${record.id} to Trash?`)) return; this.updateRecord(record.id,{folder:'Trash',unread:false}); this.selectedRecord.set(null); }
  moveToInbox(record: RequestRecord): void { this.updateRecord(record.id,{folder:'Inbox'}); this.selectedRecord.set(null); }
  closeDetails(): void { this.selectedRecord.set(null); }
  private isSameUser(left: string, right: string): boolean { return left.trim().toLowerCase() === right.trim().toLowerCase(); }
  private groupMemberIds(group: EntitlementGroup): string[] {
    return [group.owner, ...group.approvers, ...group.userIds].filter(Boolean).map(id => id.trim().toLowerCase());
  }
  private groupsForRequestCreator(creatorId: string): EntitlementGroup[] {
    const creator = creatorId.trim().toLowerCase();
    return this.groups().filter(group => group.status === 'Active' && this.groupMemberIds(group).includes(creator));
  }
  private categoryForAction(actionType: string): RequestCategory { const value=actionType.toUpperCase(); if(value.includes('HITL'))return 'HITL_PENDING'; if(value.includes('EDIT'))return 'EDIT'; if(value.includes('DELETE'))return 'DELETE'; if(value.includes('MATCH')||value.includes('CLOSE'))return 'MATCH_CLOSE'; return 'ALL'; }
  private updateRecord(id:string,patch:Partial<RequestRecord>): void { this.records.update(rows=>rows.map(r=>r.id===id?{...r,...patch}:r)); }
}