export type ApprovalScreenId = 'groups' | 'users' | 'roles' | 'triggers';
export type ApprovalAction = 'view' | 'edit' | 'manage-users' | 'configure-roles' | 'delete';
export type ApprovalStatus = 'Active' | 'Inactive' | 'Pending';

export interface EntitlementGroup {
  id: string;
  name: string;
  description: string;
  owner: string;
  approvers: string[];
  reconSelection: string;
  allEntities: number;
  updatedBy: string;
  updatedAt: string;
  status: ApprovalStatus;
  userIds: string[];
  roleIds: string[];
  reconIds: string[];
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface ReconTrigger {
  id: string;
  reconId: string;
  reconName: string;
  triggerType: string;
  value: string;
  loadStatus: string;
  matchLoadStatus: string;
  updatedBy: string;
  updatedAt: string;
}

export interface ScreenColumn<T> {
  key: keyof T | string;
  label: string;
  width?: string;
  sortable?: boolean;
}

export interface ScreenAction {
  id: ApprovalAction;
  label: string;
  icon: string;
  destructive?: boolean;
}
