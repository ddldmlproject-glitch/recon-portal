import { InjectionToken } from '@angular/core';
import { EntitlementGroup, OpsLoadTrigger, GroupUpdate, ApprovalDecision } from './grouping-approvals.models';

export interface GroupingApprovalsRepository {
  getGroups(): Promise<EntitlementGroup[]>;
  getTriggers(): Promise<OpsLoadTrigger[]>;
  createGroup(group: Omit<EntitlementGroup, 'id' | 'updatedBy' | 'updatedAt'>): Promise<EntitlementGroup>;
  saveGroup(groupId: string, update: GroupUpdate): Promise<EntitlementGroup>;
  deleteGroup(groupId: string): Promise<void>;
  decideGroup(groupId: string, decision: ApprovalDecision, comment: string): Promise<EntitlementGroup>;
}
export const GROUPING_APPROVALS_REPOSITORY = new InjectionToken<GroupingApprovalsRepository>('GROUPING_APPROVALS_REPOSITORY');
