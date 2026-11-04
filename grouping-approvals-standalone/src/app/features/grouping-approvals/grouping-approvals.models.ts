export type ApprovalStatus = 'Active' | 'Inactive' | 'Pending';
export type TriggerStatus = 'Completed' | 'Pending' | 'Failed';

export interface EntitlementGroup {
  id: string;
  groupName: string;
  description: string;
  owner: string;
  approvers: string[];
  reconSelection: 'All Recons' | 'Recon IDs';
  allEntities: number;
  updatedBy: string;
  updatedAt: string;
  status: ApprovalStatus;
  userIds: string[];
  roles: string[];
  toolsAndReports: string[];
}

export interface ReconLoadTrigger {
  id: string;
  reconId: string;
  reconName: string;
  triggerType: string;
  value: string;
  loadStatus: TriggerStatus;
  matchLoadStatus: string;
  updatedBy: string;
  updatedAt: string;
  requestedBy: string;
}

export interface GridColumn<T> {
  key: keyof T;
  label: string;
  width?: string;
}

export interface GroupingApprovalsConfig {
  title: string;
  subtitle: string;
  tabs: { id: string; label: string }[];
  groupColumns: GridColumn<EntitlementGroup>[];
  triggerColumns: GridColumn<ReconLoadTrigger>[];
  permissions: {
    canCreateGroup: boolean;
    canEditGroup: boolean;
    canManageUsers: boolean;
    canManageRoles: boolean;
    canExport: boolean;
  };
}

export interface GroupUpdate {
  description: string;
  owner: string;
  approvers: string[];
  userIds: string[];
  roles: string[];
  toolsAndReports: string[];
  reconSelection: 'All Recons' | 'Recon IDs';
  allEntities: number;
  status: ApprovalStatus;
}