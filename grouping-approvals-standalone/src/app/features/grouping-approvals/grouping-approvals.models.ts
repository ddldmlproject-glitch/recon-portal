export type ApprovalStatus = 'Active' | 'Inactive' | 'Pending' | 'Rejected';
export type TriggerStatus = 'Completed' | 'Pending' | 'Failed';
export type ApprovalDecision = 'Approved' | 'Rejected';

export interface EntitlementGroup {
  id: string;
  groupName: string;
  description: string;
  owner: string;
  approvers: string[];
  opsScope: 'All Ops' | 'Ops IDs';
  opsIds: string[];
  allEntities: number;
  updatedBy: string;
  updatedAt: string;
  status: ApprovalStatus;
  userIds: string[];
  roles: string[];
  toolsAndReports: string[];
  approvalComment?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface OpsLoadTrigger {
  id: string;
  opsId: string;
  opsName: string;
  triggerType: string;
  value: string;
  loadStatus: TriggerStatus;
  matchLoadStatus: string;
  updatedBy: string;
  updatedAt: string;
  requestedBy: string;
}

export interface GridColumn<T> { key: keyof T; label: string; width?: string; }

export interface GroupingApprovalsConfig {
  title: string;
  subtitle: string;
  tabs: { id: string; label: string }[];
  groupColumns: GridColumn<EntitlementGroup>[];
  triggerColumns: GridColumn<OpsLoadTrigger>[];
  permissions: {
    canCreateGroup: boolean;
    canEditGroup: boolean;
    canManageUsers: boolean;
    canManageRoles: boolean;
    canExport: boolean;
    canApprove: boolean;
    canDelete: boolean;
  };
}

export interface GroupUpdate {
  description: string;
  owner: string;
  approvers: string[];
  userIds: string[];
  roles: string[];
  toolsAndReports: string[];
  opsScope: 'All Ops' | 'Ops IDs';
  opsIds: string[];
  allEntities: number;
  status: ApprovalStatus;
}

export interface GroupDraft extends Omit<EntitlementGroup, 'id' | 'updatedBy' | 'updatedAt'> {}
