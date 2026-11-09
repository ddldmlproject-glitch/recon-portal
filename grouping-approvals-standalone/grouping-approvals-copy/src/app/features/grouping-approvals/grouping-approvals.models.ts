export type ApprovalStatus = 'Active' | 'Inactive' | 'Pending' | 'Rejected';
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
