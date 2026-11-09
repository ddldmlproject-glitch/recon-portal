import type { ColDef } from 'ag-grid-community';
import { ScreenConfig } from '../../core/config/screen-config.models';
import { EntitlementGroup } from './grouping-approvals.models';

const groupColumns: ColDef<EntitlementGroup>[] = [
  { field: 'groupName', headerName: 'Group Name', minWidth: 190, pinned: 'left' },
  { field: 'description', headerName: 'Description', minWidth: 240, flex: 2 },
  { field: 'owner', headerName: 'Group Owner', minWidth: 130 },
  { field: 'approvers', headerName: 'Group Approvers', minWidth: 160, valueFormatter: params => params.value?.join(', ') ?? '' },
  { field: 'status', headerName: 'Status', minWidth: 110 },
  { field: 'updatedBy', headerName: 'Updated By', minWidth: 120 },
  { field: 'updatedAt', headerName: 'Updated Date', minWidth: 160 }
];

export const GROUPING_APPROVALS_SCREENS: ScreenConfig<EntitlementGroup>[] = [
  {
    id: 'groups',
    title: 'Grouping Approvals',
    description: 'Manage entitlement groups, membership, ownership and access scope.',
    layout: 'grid',
    dataSource: { resource: 'groups', operation: 'groupsList' },
    grid: { id: 'groups-grid', rowId: 'id', columns: groupColumns, pageSize: 20, selectable: true, quickFilter: true },
    actions: [
      { id: 'create-group', label: 'Create Group', kind: 'create' },
      { id: 'export-groups', label: 'Export CSV', kind: 'export' },
      { id: 'edit-group', label: 'Edit', kind: 'edit' },
      { id: 'delete-group', label: 'Delete', kind: 'delete', confirmation: 'Delete this group? This action cannot be undone.' }
    ]
  }
];
