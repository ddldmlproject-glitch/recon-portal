import { Injectable } from '@angular/core';
import { EntitlementGroup, ReconLoadTrigger, GroupUpdate } from './grouping-approvals.models';
import { GroupingApprovalsRepository } from './grouping-approvals.repository';

const GROUPS: EntitlementGroup[] = [
  { id: 'g-1001', groupName: '1001_CHECKER', description: 'ReadWrite: User can add break comments and review reconciliation items', owner: 'sso0204', approvers: ['ys51579', 'sso0204'], reconSelection: 'All Recons', allEntities: 1, updatedBy: 'sso0204', updatedAt: '05/22/2025 04:41 AM', status: 'Active', userIds: ['GR30775', 'SA30754', 'jr14112', 'ms25678', 'rk76239', 'sc98371'], roles: ['Checker', 'Reviewer'], toolsAndReports: ['Recon Summary', 'Break Report'] },
  { id: 'g-1002', groupName: '1001_MAKER', description: 'Default system group for maker activities', owner: 's91333', approvers: ['ys51579'], reconSelection: 'Recon IDs', allEntities: 0, updatedBy: 's91333', updatedAt: '03/19/2016 08:32 AM', status: 'Active', userIds: ['mk12001', 'mk12002'], roles: ['Maker'], toolsAndReports: ['Recon Summary'] },
  { id: 'g-1003', groupName: 'LATAM_VIEW_ONLY_FOM', description: 'ReadOnly: User access to view matched items', owner: 'dm11327', approvers: ['sso0204'], reconSelection: 'All Recons', allEntities: 1, updatedBy: 'dm11327', updatedAt: '05/22/2025 04:06 AM', status: 'Active', userIds: ['latam001'], roles: ['Read Only'], toolsAndReports: ['Recon Summary', 'Audit Report'] },
  { id: 'g-1004', groupName: 'TLМ_STRD_OPSREC_SO_NA2', description: 'ReadWrite: Operations user can match items', owner: 'st30814', approvers: ['sso0204', 'ys51579'], reconSelection: 'Recon IDs', allEntities: 0, updatedBy: 'st30814', updatedAt: '02/19/2022 04:07 AM', status: 'Pending', userIds: ['ops1001', 'ops1002'], roles: ['Operations'], toolsAndReports: ['Match Workbench'] }
];

const TRIGGERS: ReconLoadTrigger[] = [
  { id: 't-1', reconId: 'R-10021', reconName: 'US Equity Daily Recon', triggerType: 'Manual', value: 'Daily', loadStatus: 'Completed', matchLoadStatus: 'Loaded', updatedBy: 'sso0204', updatedAt: '10/30/2026 09:15 AM', requestedBy: 'sso0204' },
  { id: 't-2', reconId: 'R-10022', reconName: 'LATAM Cash Reconciliation', triggerType: 'Scheduled', value: 'Hourly', loadStatus: 'Pending', matchLoadStatus: 'Not Started', updatedBy: 'dm11327', updatedAt: '10/30/2026 08:42 AM', requestedBy: 'dm11327' },
  { id: 't-3', reconId: 'R-10023', reconName: 'Fixed Income Positions', triggerType: 'Manual', value: 'One-time', loadStatus: 'Failed', matchLoadStatus: 'Not Loaded', updatedBy: 'st30814', updatedAt: '10/29/2026 05:30 PM', requestedBy: 'st30814' }
];

@Injectable()
export class GroupingApprovalsMockRepository implements GroupingApprovalsRepository {
  private groups = structuredClone(GROUPS);
  private triggers = structuredClone(TRIGGERS);

  async getGroups(): Promise<EntitlementGroup[]> { return structuredClone(this.groups); }
  async getTriggers(): Promise<ReconLoadTrigger[]> { return structuredClone(this.triggers); }

  async saveGroup(groupId: string, update: GroupUpdate): Promise<EntitlementGroup> {
    const index = this.groups.findIndex(group => group.id === groupId);
    if (index < 0) throw new Error(`Entitlement group ${groupId} was not found`);
    this.groups[index] = { ...this.groups[index], ...update, updatedBy: 'demo.user', updatedAt: new Date().toLocaleString() };
    return structuredClone(this.groups[index]);
  }
}