import type { ColDef, ValueFormatterParams } from '@ag-grid-community/core';
import { ScreenConfig } from '../../core/config/screen-config.models';
import { EntitlementGroup, OpsLoadTrigger, GroupApprovalRequest } from './grouping-approvals.models';

const groupColumns: ColDef<EntitlementGroup>[] = [
  { field: 'groupName', headerName: 'Group Name', minWidth: 190, pinned: 'left' },
  { field: 'description', headerName: 'Description', minWidth: 240, flex: 2 },
  { field: 'owner', headerName: 'Group Owner', minWidth: 130 },
  { field: 'approvers', headerName: 'Group Approvers', minWidth: 160, valueFormatter: (p: ValueFormatterParams<EntitlementGroup, string[]>) => p.value?.join(', ') ?? '' },
  { field: 'status', headerName: 'Status', minWidth: 110 },
  { field: 'updatedBy', headerName: 'Updated By', minWidth: 120 },
  { field: 'updatedAt', headerName: 'Updated Date', minWidth: 160 }
];
const triggerColumns: ColDef<OpsLoadTrigger>[] = [
  { field: 'opsId', headerName: 'Ops ID', minWidth: 120 },
  { field: 'opsName', headerName: 'Ops Name', minWidth: 190, flex: 2 },
  { field: 'triggerType', headerName: 'Trigger Type', minWidth: 130 },
  { field: 'value', headerName: 'Value', minWidth: 100 },
  { field: 'loadStatus', headerName: 'Load Status', minWidth: 120 },
  { field: 'matchLoadStatus', headerName: 'Match Load Status', minWidth: 150 },
  { field: 'updatedBy', headerName: 'Updated By', minWidth: 120 },
  { field: 'updatedAt', headerName: 'Updated Date', minWidth: 160 }
];

const inboxColumns: ColDef<GroupApprovalRequest>[] = [
  { field: 'groupName', headerName: 'Group Name', minWidth: 190, pinned: 'left' },
  { field: 'owner', headerName: 'Requested By', minWidth: 130 },
  { field: 'description', headerName: 'Description', minWidth: 220, flex: 2 },
  { field: 'approvers', headerName: 'Approvers', minWidth: 150, valueFormatter: (p: ValueFormatterParams<GroupApprovalRequest, string[]>) => p.value?.join(', ') ?? '' },
  { field: 'status', headerName: 'Request Status', minWidth: 130 },
  { field: 'createdAt', headerName: 'Created / Updated', minWidth: 165 }
];

export const GROUPING_APPROVALS_SCREENS: ScreenConfig<any>[] = [
  { id: 'groups', title: 'Grouping', description: 'Manage group membership, ownership and access scope.', layout: 'grid', dataSource: { resource: 'groups', operation: 'groupsList' }, grid: { id: 'groups-grid', rowId: 'id', columns: groupColumns, pageSize: 20, selectable: true, quickFilter: true }, actions: [{ id: 'export-groups', label: 'Export CSV', kind: 'export' }, { id: 'edit-group', label: 'Edit', kind: 'edit' }, { id: 'delete-group', label: 'Delete', kind: 'delete', confirmation: 'Delete this group? This action cannot be undone.' }] },
  { id: 'inbox', title: 'Inbox', description: 'Review and action group access requests.', layout: 'grid', dataSource: { resource: 'group-approval-requests', operation: 'approvalRequestsList' }, grid: { id: 'group-approval-inbox-grid', rowId: 'id', columns: inboxColumns, pageSize: 10, selectable: false, quickFilter: true }, actions: [{ id: 'approve-group', label: 'Approve', kind: 'custom' }, { id: 'reject-group', label: 'Reject', kind: 'custom' }] },
  { id: 'triggers', title: 'Orchestration', description: 'Review orchestration activity.', layout: 'grid', dataSource: { resource: 'ops-load-triggers', operation: 'triggersList' }, grid: { id: 'triggers-grid', rowId: 'id', columns: triggerColumns, pageSize: 20, selectable: true, quickFilter: true }, actions: [] }
];
