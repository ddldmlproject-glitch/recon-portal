import { ApprovalScreenId, ScreenAction, ScreenColumn } from './grouping-approvals.models';

export interface ApprovalScreenConfig {
  id: ApprovalScreenId;
  title: string;
  description: string;
  navLabel: string;
  icon: string;
  primaryAction?: string;
}

export class GroupingApprovalsPageConfig {
  readonly applicationTitle = 'Grouping & Approvals';
  readonly applicationSubtitle = 'Entitlement administration workspace';
  readonly screens: ApprovalScreenConfig[] = [
    { id: 'groups', title: 'Entitlement Groups', navLabel: 'Groups', icon: '▦', description: 'Create, review and maintain entitlement groups.', primaryAction: 'Create group' },
    { id: 'users', title: 'Manage Group Users', navLabel: 'Group Users', icon: '♙', description: 'Assign and remove users from entitlement groups.' },
    { id: 'roles', title: 'Role Setup', navLabel: 'Role Setup', icon: '▤', description: 'Configure recon, user action, role, tool and report permissions.' },
    { id: 'triggers', title: 'Recon Load Triggers', navLabel: 'Load Triggers', icon: '⟳', description: 'Search and review recon load trigger records.' }
  ];

  readonly groupColumns: ScreenColumn<any>[] = [
    { key: 'name', label: 'Group Name', width: '190px' },
    { key: 'description', label: 'Description', width: '260px' },
    { key: 'owner', label: 'Group Owner', width: '140px' },
    { key: 'approvers', label: 'Group Approvers', width: '180px' },
    { key: 'reconSelection', label: 'Recon Selection', width: '150px' },
    { key: 'allEntities', label: 'All Entities', width: '105px' },
    { key: 'updatedBy', label: 'Updated By', width: '130px' },
    { key: 'updatedAt', label: 'Updated Date', width: '170px' }
  ];

  readonly triggerColumns: ScreenColumn<any>[] = [
    { key: 'id', label: 'Trigger Id', width: '110px' },
    { key: 'reconId', label: 'Recon Id', width: '110px' },
    { key: 'reconName', label: 'Source Recon Name', width: '190px' },
    { key: 'triggerType', label: 'Trigger Type', width: '130px' },
    { key: 'value', label: 'Value', width: '100px' },
    { key: 'loadStatus', label: 'Load Status', width: '130px' },
    { key: 'matchLoadStatus', label: 'Match Load Status', width: '150px' },
    { key: 'updatedBy', label: 'Updated By', width: '120px' },
    { key: 'updatedAt', label: 'Updated Date', width: '170px' }
  ];

  readonly groupActions: ScreenAction[] = [
    { id: 'view', label: 'View details', icon: '◉' },
    { id: 'edit', label: 'Edit group', icon: '✎' },
    { id: 'manage-users', label: 'Manage users', icon: '♙' },
    { id: 'configure-roles', label: 'Configure roles', icon: '▤' },
    { id: 'delete', label: 'Delete group', icon: '⌫', destructive: true }
  ];

  getScreen(id: ApprovalScreenId): ApprovalScreenConfig {
    return this.screens.find(screen => screen.id === id) ?? this.screens[0];
  }
}
