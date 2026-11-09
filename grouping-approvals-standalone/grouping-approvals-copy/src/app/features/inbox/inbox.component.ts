import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { AgGridAngular } from '@ag-grid-community/angular';
import type { ColDef, GridOptions, ICellRendererParams } from '@ag-grid-community/core';
import { themeQuartz } from 'ag-grid-community';
import { ApprovalDecision, EntitlementGroup, GroupApprovalRequest } from '../grouping-approvals/grouping-approvals.models';
import { GROUPING_APPROVALS_SCREENS } from '../grouping-approvals/grouping-approvals.screen-config';

export type InboxView = 'my-group' | 'my-request' | 'all';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, AgGridAngular],
  templateUrl: './inbox.component.html',
  styleUrl: './inbox.component.scss'
})
export class InboxComponent {
  readonly groups = input<EntitlementGroup[]>([]);
  readonly currentUserId = input('sso0204');
  readonly decision = output<{ groupId: string; decision: ApprovalDecision; comment: string }>();
  readonly searchText = signal('');
  readonly activeView = signal<InboxView>('all');
  readonly selectedRequest = signal<GroupApprovalRequest | null>(null);
  readonly comment = signal('');

  readonly requests = computed(() => this.groups().map(group => GroupApprovalRequest.fromGroup(group)));
  readonly viewRequests = computed(() => {
    const userId = this.currentUserId().trim().toLowerCase();
    return this.requests().filter(request => {
      if (this.activeView() === 'my-group') return request.approvers.some(id => id.trim().toLowerCase() === userId);
      if (this.activeView() === 'my-request') return request.owner.trim().toLowerCase() === userId;
      return true;
    });
  });
  readonly filteredRequests = computed(() => {
    const query = this.searchText().trim().toLowerCase();
    return this.viewRequests().filter(request => !query || [
      request.groupName, request.description, request.owner, request.status,
      ...request.approvers, ...request.userIds, ...request.roles
    ].join(' ').toLowerCase().includes(query));
  });
  readonly pendingCount = computed(() => this.viewRequests().filter(request => request.status === 'Pending').length);
  readonly approvedCount = computed(() => this.viewRequests().filter(request => request.status === 'Active').length);
  readonly columns: ColDef<GroupApprovalRequest>[] = [
    ...(GROUPING_APPROVALS_SCREENS[1].grid!.columns as ColDef<GroupApprovalRequest>[]),
    {
      headerName: 'Assigned To', colId: 'assignedTo', minWidth: 150,
      valueGetter: params => params.data?.approvers.join(', ') ?? '—'
    },
    {
      headerName: 'Actions', colId: 'approvalActions', pinned: 'right', minWidth: 170,
      sortable: false, filter: false, resizable: false,
      cellRenderer: (params: ICellRendererParams<GroupApprovalRequest>) => {
        const row = params.data;
        const wrapper = document.createElement('div');
        wrapper.className = 'inbox-grid-actions';
        if (!row || row.status !== 'Pending' || !this.isAssignedApprover(row)) {
          const label = document.createElement('span');
          label.className = 'inbox-action-unavailable';
          label.textContent = row?.status === 'Pending' ? 'Not assigned' : '—';
          wrapper.append(label);
          return wrapper;
        }
        for (const decision of ['Approved', 'Rejected'] as const) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = decision === 'Approved' ? 'inbox-grid-approve' : 'inbox-grid-reject';
          button.textContent = decision === 'Approved' ? 'Approve' : 'Reject';
          button.addEventListener('click', event => {
            event.stopPropagation();
            this.decision.emit({ groupId: row.groupId, decision, comment: '' });
          });
          wrapper.append(button);
        }
        return wrapper;
      }
    }
  ];
  readonly gridOptions: GridOptions<GroupApprovalRequest> = {
    animateRows: true, pagination: true, paginationPageSize: 10,
     rowHeight: 46,
    onRowClicked: event => { if (event.data) this.openRequest(event.data); }
  };

  isAssignedApprover(request: GroupApprovalRequest): boolean {
    const userId = this.currentUserId().trim().toLowerCase();
    return !!userId && request.approvers.some(id => id.trim().toLowerCase() === userId);
  }
  setView(view: InboxView): void { this.activeView.set(view); }
  openRequest(request: GroupApprovalRequest): void {
    this.selectedRequest.set(request);
    this.comment.set(request.approvalComment ?? '');
  }
  closeDetails(): void { this.selectedRequest.set(null); }
  approve(): void { this.submitDecision('Approved'); }
  reject(): void { this.submitDecision('Rejected'); }
  private submitDecision(decision: ApprovalDecision): void {
    const request = this.selectedRequest();
    if (!request || request.status !== 'Pending' || !this.isAssignedApprover(request)) return;
    this.decision.emit({ groupId: request.groupId, decision, comment: this.comment().trim() });
    this.selectedRequest.set(null);
  }
}
