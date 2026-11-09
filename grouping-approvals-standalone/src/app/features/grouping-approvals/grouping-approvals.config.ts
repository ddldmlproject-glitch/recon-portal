import { GroupingApprovalsConfig } from './grouping-approvals.models';

export const GROUPING_APPROVALS_CONFIG: GroupingApprovalsConfig = {
  title: 'Admin',
  subtitle: 'Manage groups, approvals and orchestration',
  tabs: [
    { id: 'grouping', label: 'Grouping' },
    { id: 'inbox', label: 'Inbox' },
    { id: 'orchestration', label: 'Orchestration' }
  ],
  groupColumns: [
    { key: 'groupName', label: 'Group Name', width: '190px' },
    { key: 'description', label: 'Description' },
    { key: 'owner', label: 'Group Owner', width: '140px' },
    { key: 'approvers', label: 'Group Approvers', width: '160px' },
    { key: 'updatedBy', label: 'Updated By', width: '120px' },
    { key: 'updatedAt', label: 'Updated Date', width: '150px' }
  ],
  triggerColumns: [
    { key: 'opsId', label: 'Ops ID', width: '120px' },
    { key: 'opsName', label: 'Ops Name', width: '190px' },
    { key: 'triggerType', label: 'Trigger Type', width: '140px' },
    { key: 'value', label: 'Value', width: '100px' },
    { key: 'loadStatus', label: 'Load Status', width: '120px' },
    { key: 'matchLoadStatus', label: 'Match Load Status', width: '150px' },
    { key: 'updatedBy', label: 'Updated By', width: '120px' },
    { key: 'updatedAt', label: 'Updated Date', width: '150px' }
  ],
  permissions: {
    canCreateGroup: true,
    canEditGroup: true,
    canManageUsers: true,
    canManageRoles: true,
    canExport: true,
    canApprove: false,
    canDelete: true
  }
};