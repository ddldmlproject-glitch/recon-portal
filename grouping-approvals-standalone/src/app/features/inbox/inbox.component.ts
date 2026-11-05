import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridOptions, RowClickedEvent } from 'ag-grid-community';
import { themeQuartz } from 'ag-grid-community';

type InboxFolder = 'Inbox' | 'Starred' | 'Snoozed' | 'Important' | 'Sent' | 'Drafts' | 'Spam' | 'Trash';
type InboxStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'DRAFT';
interface InboxMessage {
  id: string; subject: string; actionType: string; tool: string; createdBy: string;
  details: string; comments: string; status: InboxStatus; priority: 'High' | 'Medium' | 'Low';
  createdAt: string; unread: boolean; starred: boolean; important: boolean;
  folder: InboxFolder; snoozedUntil?: string;
}
@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './inbox.component.html',
  styleUrl: './inbox.component.scss'
})
export class InboxComponent {
  readonly folders: { name: InboxFolder; icon: string }[] = [
    { name: 'Inbox', icon: 'inbox' }, { name: 'Starred', icon: 'star' }, { name: 'Snoozed', icon: 'clock' },
    { name: 'Important', icon: 'bookmark' }, { name: 'Sent', icon: 'send' }, { name: 'Drafts', icon: 'file' },
    { name: 'Spam', icon: 'shield-alert' }, { name: 'Trash', icon: 'trash' }
  ];
  readonly activeFolder = signal<InboxFolder>('Inbox');
  readonly searchText = signal('');
  readonly selected = signal<InboxMessage | null>(null);
  readonly createOpen = signal(false);
  readonly unreadCount = computed(() => this.messages().filter(m => m.folder === 'Inbox' && m.unread).length);
  readonly messages = signal<InboxMessage[]>([
    { id:'REQ-10482', subject:'Access to payment exception dashboard', actionType:'Access Request', tool:'Payment Exception Dashboard', createdBy:'Aarav Mehta', details:'Requesting read and export access to the payment exception dashboard for month-end analysis.', comments:'Needed for the November close activities.', status:'PENDING_APPROVAL', priority:'High', createdAt:'2026-11-05T09:42:00', unread:true, starred:true, important:true, folder:'Inbox' },
    { id:'REQ-10479', subject:'Enable settlement monitoring report', actionType:'Report Enablement', tool:'Settlement Monitoring', createdBy:'Sophia Chen', details:'Please enable the settlement monitoring report for the operations team.', comments:'Manager approval attached in the request.', status:'PENDING_APPROVAL', priority:'Medium', createdAt:'2026-11-05T08:15:00', unread:true, starred:false, important:false, folder:'Inbox' },
    { id:'REQ-10471', subject:'Update maker-checker role mapping', actionType:'Role Change', tool:'User Access Management', createdBy:'Noah Williams', details:'Update role mapping for the listed users to support the new operating model.', comments:'Please apply from the next business day.', status:'APPROVED', priority:'Medium', createdAt:'2026-11-04T16:28:00', unread:false, starred:false, important:true, folder:'Inbox' },
    { id:'REQ-10463', subject:'New data quality workspace', actionType:'Workspace Request', tool:'Data Quality Workspace', createdBy:'Isabella Garcia', details:'Create a workspace for the data quality review team.', comments:'Initial access for five team members.', status:'COMPLETED', priority:'Low', createdAt:'2026-11-04T11:05:00', unread:false, starred:false, important:false, folder:'Inbox' },
    { id:'REQ-10452', subject:'Temporary elevated access', actionType:'Access Request', tool:'Operations Console', createdBy:'Ethan Brown', details:'Temporary elevated access for incident investigation.', comments:'Access required for four hours.', status:'PENDING_APPROVAL', priority:'High', createdAt:'2026-11-03T14:36:00', unread:false, starred:true, important:false, folder:'Inbox' }
  ]);
  readonly filteredMessages = computed(() => {
    const folder = this.activeFolder(), q = this.searchText().trim().toLowerCase();
    return this.messages().filter(m => {
      const inFolder = folder === 'Inbox' ? m.folder === 'Inbox' : folder === 'Starred' ? m.starred : folder === 'Important' ? m.important : folder === 'Snoozed' ? m.folder === 'Snoozed' : m.folder === folder;
      return inFolder && (!q || [m.id,m.subject,m.actionType,m.tool,m.createdBy,m.status].join(' ').toLowerCase().includes(q));
    });
  });
  readonly columnDefs: ColDef<InboxMessage>[] = [
    { headerName:'', field:'starred', width:48, maxWidth:48, sortable:false, filter:false, cellRenderer: p => p.value ? '★' : '☆', cellClass:'inbox-star-cell' },
    { field:'id', headerName:'Request ID', minWidth:118, maxWidth:135 },
    { field:'subject', headerName:'Subject', minWidth:230, flex:2, cellRenderer: p => p.data ? (p.data.unread ? '●  ' : '') + p.value : p.value },
    { field:'actionType', headerName:'Action Type', minWidth:145 },
    { field:'tool', headerName:'Tool / Report', minWidth:175, flex:1 },
    { field:'createdBy', headerName:'Created By', minWidth:135 },
    { field:'priority', headerName:'Priority', minWidth:95 },
    { field:'status', headerName:'Status', minWidth:150, cellClass:'inbox-status-cell' },
    { field:'createdAt', headerName:'Received', minWidth:155, valueFormatter: p => p.value ? new Date(p.value).toLocaleString() : '' }
  ];
  readonly gridOptions: GridOptions<InboxMessage> = {
    animateRows:true, pagination:true, paginationPageSize:10, paginationPageSizeSelector:[10,20,50],
    rowHeight:52, headerHeight:42, suppressCellFocus:true, getRowClass:p => p.data?.unread ? 'inbox-row-unread' : ''
  };
  readonly gridTheme = themeQuartz.withParams({ spacing:7, fontSize:12, borderRadius:5, headerFontSize:11, rowHoverColor:'#f0f7fc' });
  readonly draft = signal({ actionType:'Access Request', tool:'', createdBy:'', details:'', comments:'', priority:'Medium' as 'High'|'Medium'|'Low' });
  setFolder(folder: InboxFolder): void { this.activeFolder.set(folder); this.selected.set(null); }
  openMessage(message: InboxMessage): void {
    this.messages.update(rows => rows.map(m => m.id === message.id ? { ...m, unread:false } : m));
    this.selected.set({ ...message, unread:false });
  }
  toggleStar(message: InboxMessage): void { this.messages.update(rows => rows.map(m => m.id === message.id ? { ...m, starred:!m.starred } : m)); if(this.selected()?.id===message.id) this.selected.update(v=>v?{...v,starred:!v.starred}:v); }
  toggleImportant(message: InboxMessage): void { this.messages.update(rows => rows.map(m => m.id === message.id ? { ...m, important:!m.important } : m)); }
  setStatus(status: InboxStatus): void { const selected=this.selected(); if(!selected)return; this.messages.update(rows=>rows.map(m=>m.id===selected.id?{...m,status,unread:false}:m)); this.selected.update(m=>m?{...m,status}:m); }
  moveTo(folder: InboxFolder): void { const selected=this.selected(); if(!selected)return; this.messages.update(rows=>rows.map(m=>m.id===selected.id?{...m,folder}:m)); this.selected.set(null); }
  snooze(): void { this.moveTo('Snoozed'); }
  openCreate(): void { this.draft.set({actionType:'Access Request',tool:'',createdBy:'',details:'',comments:'',priority:'Medium'}); this.createOpen.set(true); }
  createRequest(): void {
    const d=this.draft(); if(!d.tool.trim()||!d.createdBy.trim()||!d.details.trim()) return;
    const id='REQ-'+(10500+this.messages().length+1);
    const created: InboxMessage={id,subject:d.tool.trim()+' — '+d.actionType,actionType:d.actionType,tool:d.tool.trim(),createdBy:d.createdBy.trim(),details:d.details.trim(),comments:d.comments.trim(),status:'PENDING_APPROVAL',priority:d.priority,createdAt:new Date().toISOString(),unread:false,starred:false,important:false,folder:'Sent'};
    this.messages.update(rows=>[created,...rows]); this.createOpen.set(false); this.setFolder('Sent'); this.selected.set(created);
  }
  updateDraft<K extends keyof ReturnType<typeof this.draft>>(key: K, value: ReturnType<typeof this.draft>[K]): void { this.draft.update(d=>({...d,[key]:value})); }
  closeDetails(): void { this.selected.set(null); }
  rowClicked(event: RowClickedEvent<InboxMessage>): void { if(event.data)this.openMessage(event.data); }
  trackFolder(_index:number, folder:{name:InboxFolder}):string { return folder.name; }
}
