import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridOptions, ICellRendererParams } from 'ag-grid-community';
import { themeQuartz } from 'ag-grid-community';
import { ApprovalDecision, EntitlementGroup, GroupApprovalRequest } from '../grouping-approvals/grouping-approvals.models';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, AgGridAngular],
  templateUrl: './inbox.component.html',
  styleUrl: './inbox.component.scss'
})
export class InboxComponent {
  readonly groups = input<EntitlementGroup[]>([]);
  readonly decision = output<{ groupId: string; decision: ApprovalDecision; comment: string }>();
  readonly searchText = signal('');
  readonly selectedRequest = signal<GroupApprovalRequest | null>(null);
  readonly comment = signal('');

  readonly requests = computed(() => this.groups().map(group => GroupApprovalRequest.fromGroup(group)));
  readonly filteredRequests = computed(() => {
    const query = this.searchText().trim().toLowerCase();
    return this.requests().filter(request => !query || [
      request.groupName, request.description, request.owner, request.status,
      ...request.approvers, ...request.userIds, ...request.roles
    ].join(' ').toLowerCase().includes(query));
  });
  readonly pendingCount = computed(() => this.requests().filter(request => request.status === 'Pending').length);
  readonly approvedCount = computed(() => this.requests().filter(request => request.status === 'Active').length);
  readonly columns: ColDef<GroupApprovalRequest>[] = [
    { field: 'groupName', headerName: 'Group Name', minWidth: 190, pinned: 'left' },
    { field: 'owner', headerName: 'Requested By', minWidth: 130 },
    { field: 'description', headerName: 'Description', minWidth: 220, flex: 2 },
    { field: 'approvers', headerName: 'Approvers', minWidth: 150, valueFormatter: p => p.value?.join(', ') ?? '' },
    { field: 'status', headerName: 'Request Status', minWidth: 130, cellClass: p => p.value === 'Pending' ? 'inbox-status-pending' : p.value === 'Rejected' ? 'inbox-status-rejected' : 'inbox-status-approved' },
    { field: 'createdAt', headerName: 'Created / Updated', minWidth: 165 }
  ];
  readonly gridOptions: GridOptions<GroupApprovalRequest> = {
    animateRows: true, pagination: true, paginationPageSize: 10,
    paginationPageSizeSelector: [10, 20, 50], rowHeight: 46,
    onRowClicked: event => { if (event.data) this.openRequest(event.data); }
  };
  readonly theme = themeQuartz.withParams({ spacing: 7, fontSize: 12, borderRadius: 5, headerFontSize: 11 });

  openRequest(request: GroupApprovalRequest): void {
    this.selectedRequest.set(request);
    this.comment.set(request.approvalComment ?? '');
  }
  closeDetails(): void { this.selectedRequest.set(null); }
  approve(): void { this.submitDecision('Approved'); }
  reject(): void { this.submitDecision('Rejected'); }
  private submitDecision(decision: ApprovalDecision): void {
    const request = this.selectedRequest();
    if (!request || request.status !== 'Pending') return;
    this.decision.emit({ groupId: request.groupId, decision, comment: this.comment().trim() });
    this.selectedRequest.set(null);
  }
}
