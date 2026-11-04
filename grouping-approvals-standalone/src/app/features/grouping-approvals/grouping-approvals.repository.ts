import { InjectionToken } from '@angular/core';
import { EntitlementGroup, ReconLoadTrigger, GroupUpdate } from './grouping-approvals.models';
export interface GroupingApprovalsRepository {
  getGroups(): Promise<EntitlementGroup[]>;
  getTriggers(): Promise<ReconLoadTrigger[]>;
  createGroup(group: Omit<EntitlementGroup, 'id' | 'updatedBy' | 'updatedAt'>): Promise<EntitlementGroup>;
  saveGroup(groupId: string, update: GroupUpdate): Promise<EntitlementGroup>;
}
export const GROUPING_APPROVALS_REPOSITORY = new InjectionToken<GroupingApprovalsRepository>('GROUPING_APPROVALS_REPOSITORY');
