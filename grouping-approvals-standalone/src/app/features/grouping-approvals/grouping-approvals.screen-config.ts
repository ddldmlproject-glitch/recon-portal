import type { ColDef } from 'ag-grid-community';
import { ScreenConfig } from '../../core/config/screen-config.models';
import { EntitlementGroup, ReconLoadTrigger } from './grouping-approvals.models';

const groupColumns: ColDef<EntitlementGroup>[] = [
  { field: 'groupName', headerName: 'Group Name', minWidth: 190, pinned: 'left' },
  { field: 'description', headerName: 'Description', minWidth: 240, flex: 2 },
  { field: 'owner', headerName: 'Group Owner', minWidth: 130 },
  { field: 'approvers', headerName: 'Group Approvers', minWidth: 160, valueFormatter: p => p.value?.join(', ') ?? '' },
  { field: 'reconSelection', headerName: 'Recon Selection', minWidth: 135 },
  { field: 'reconIds', headerName: 'Recon IDs', minWidth: 150, valueFormatter: p => p.value?.join(', ') ?? '' },
  { field: 'allEntities', headerName: 'All Entities', minWidth: 110, valueFormatter: p => p.value ? 'Yes' : 'No' },
  { field: 'status', headerName: 'Status', minWidth: 110 },
  { field: 'updatedBy', headerName: 'Updated By', minWidth: 120 },
  { field: 'updatedAt', headerName: 'Updated Date', minWidth: 160 }
];
const triggerColumns: ColDef<ReconLoadTrigger>[] = [
  { field: 'reconId', headerName: 'Recon ID', minWidth: 120 },
  { field: 'reconName', headerName: 'Recon Name', minWidth: 190, flex: 2 },
  { field: 'triggerType', headerName: 'Trigger Type', minWidth: 130 },
  { field: 'value', headerName: 'Value', minWidth: 100 },
  { field: 'loadStatus', headerName: 'Load Status', minWidth: 120 },
  { field: 'matchLoadStatus', headerName: 'Match Load Status', minWidth: 150 },
  { field: 'updatedBy', headerName: 'Updated By', minWidth: 120 },
  { field: 'updatedAt', headerName: 'Updated Date', minWidth: 160 }
];

export const GROUPING_APPROVALS_SCREENS: ScreenConfig<any>[] = [
  { id: 'groups', title: 'Entitlement Groups', description: 'Manage group membership, ownership and reconciliation access.', layout: 'grid', dataSource: { resource: 'groups', operation: 'groupsList' }, grid: { id: 'groups-grid', rowId: 'id', columns: groupColumns, pageSize: 20, selectable: true, quickFilter: true }, actions: [{ id: 'create-group', label: 'Create Group', kind: 'create' }, { id: 'export-groups', label: 'Export CSV', kind: 'export' }, { id: 'edit-group', label: 'Edit', kind: 'edit' }, { id: 'delete-group', label: 'Delete', kind: 'delete', confirmation: 'Delete this group? This action cannot be undone.' }] },
  { id: 'triggers', title: 'Recon Load Triggers', description: 'Review reconciliation load trigger activity.', layout: 'grid', dataSource: { resource: 'recon-load-triggers', operation: 'triggersList' }, grid: { id: 'triggers-grid', rowId: 'id', columns: triggerColumns, pageSize: 20, selectable: true, quickFilter: true }, actions: [] }
];
