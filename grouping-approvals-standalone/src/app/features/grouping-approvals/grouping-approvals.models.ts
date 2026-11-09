export type ApprovalStatus = 'Active' | 'Inactive' | 'Pending' | 'Rejected';
export type TriggerStatus = 'Completed' | 'Pending' | 'Failed';
export type ApprovalDecision = 'Approved' | 'Rejected';

export class EntitlementGroup {
  constructor(
    public id: string,
    public groupName: string,
    public description: string,
    public owner: string,
    public approvers: string[],
    public opsScope: 'All Ops' | 'Ops IDs',
    public opsIds: string[],
    public allEntities: number,
    public updatedBy: string,
    public updatedAt: string,
    public status: ApprovalStatus,
    public userIds: string[],
    public roles: string[],
    public toolsAndReports: string[],
    public approvalComment?: string,
    public approvedBy?: string,
    public approvedAt?: string
  ) {}

  static fromResponse(value: Partial<EntitlementGroup>): EntitlementGroup {
    return new EntitlementGroup(
      String(value.id ?? ''), String(value.groupName ?? ''), String(value.description ?? ''),
      String(value.owner ?? ''), [...(value.approvers ?? [])],
      value.opsScope === 'Ops IDs' ? 'Ops IDs' : 'All Ops', [...(value.opsIds ?? [])],
      Number(value.allEntities ?? 0), String(value.updatedBy ?? ''), String(value.updatedAt ?? ''),
      value.status ?? 'Pending', [...(value.userIds ?? [])], [...(value.roles ?? [])],
      [...(value.toolsAndReports ?? [])], value.approvalComment, value.approvedBy, value.approvedAt
    );
  }
}

export class OpsLoadTrigger {
  constructor(
    public id: string, public opsId: string, public opsName: string, public triggerType: string,
    public value: string, public loadStatus: TriggerStatus, public matchLoadStatus: string,
    public updatedBy: string, public updatedAt: string, public requestedBy: string
  ) {}
}

export class GroupApprovalRequest {
  constructor(
    public id: string, public groupId: string, public groupName: string, public description: string,
    public owner: string, public approvers: string[], public userIds: string[], public roles: string[],
    public toolsAndReports: string[], public status: ApprovalStatus, public createdAt: string,
    public updatedAt: string, public approvedBy?: string, public approvalComment?: string
  ) {}

  static fromGroup(group: EntitlementGroup): GroupApprovalRequest {
    return new GroupApprovalRequest(
      group.id, group.id, group.groupName, group.description, group.owner, [...group.approvers],
      [...group.userIds], [...group.roles], [...group.toolsAndReports], group.status,
      group.updatedAt, group.updatedAt, group.approvedBy, group.approvalComment
    );
  }
}

export class ApiResponse<T> {
  constructor(
    public success: boolean,
    public message: string,
    public data: T,
    public timestamp: string = new Date().toISOString(),
    public correlationId?: string
  ) {}
}

export interface GridColumn<T> { key: keyof T; label: string; width?: string; }
export interface GroupingApprovalsConfig {
  title: string; subtitle: string; tabs: { id: string; label: string }[];
  groupColumns: GridColumn<EntitlementGroup>[]; triggerColumns: GridColumn<OpsLoadTrigger>[];
  permissions: { canCreateGroup: boolean; canEditGroup: boolean; canManageUsers: boolean; canManageRoles: boolean; canExport: boolean; canApprove: boolean; canDelete: boolean; };
}
export interface GroupUpdate {
  groupName: string; description: string; owner: string; approvers: string[]; userIds: string[]; roles: string[];
  toolsAndReports: string[]; opsScope: 'All Ops' | 'Ops IDs'; opsIds: string[];
  allEntities: number; status: ApprovalStatus;
}
export type GroupDraft = Omit<EntitlementGroup, 'id' | 'updatedBy' | 'updatedAt'>;
