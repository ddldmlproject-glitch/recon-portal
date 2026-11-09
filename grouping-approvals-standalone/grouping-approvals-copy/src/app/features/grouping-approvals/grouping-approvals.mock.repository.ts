import { Injectable } from '@angular/core';
import { EntitlementGroup, OpsLoadTrigger, GroupUpdate, ApprovalDecision } from './grouping-approvals.models';
import { GroupingApprovalsRepository } from './grouping-approvals.repository';

const GROUPS: EntitlementGroup[] = [
  { id: 'g-1001', groupName: '1001_ReghubOps2', description: 'ReadWrite: User can add break comments and review operations items', owner: 'sso0204', approvers: ['ys51579', 'sso0204'], opsScope: 'All Ops', opsIds: [], allEntities: 1, updatedBy: 'sso0204', updatedAt: '05/22/2025 04:41 AM', status: 'Active', userIds: ['GR30775', 'SA30754', 'jr14112', 'ms25678', 'rk76239', 'sc98371'], roles: ['ReghubOps2', 'Reviewer'], toolsAndReports: ['ReghubOps Summary', 'Break Report'] },
  { id: 'g-1002', groupName: '1001_ReghubOps1', description: 'Default system group for reghubops1 activities', owner: 's91333', approvers: ['ys51579'], opsScope: 'Ops IDs', opsIds: ['R-10021'], allEntities: 0, updatedBy: 's91333', updatedAt: '03/19/2016 08:32 AM', status: 'Active', userIds: ['mk12001', 'mk12002'], roles: ['ReghubOps1'], toolsAndReports: ['ReghubOps Summary'] },
  { id: 'g-1003', groupName: 'LATAM_VIEW_ONLY_FOM', description: 'ReadOnly: User access to view matched items', owner: 'dm11327', approvers: ['sso0204'], opsScope: 'All Ops', opsIds: [], allEntities: 1, updatedBy: 'dm11327', updatedAt: '05/22/2025 04:06 AM', status: 'Active', userIds: ['latam001'], roles: ['Read Only'], toolsAndReports: ['ReghubOps Summary', 'Audit Report'] },
  { id: 'g-1004', groupName: 'TLM_STRD_OPSREC_SO_NA2', description: 'ReadWrite: Operations user can match items', owner: 'st30814', approvers: ['sso0204', 'ys51579'], opsScope: 'Ops IDs', opsIds: ['R-10022', 'R-10023'], allEntities: 0, updatedBy: 'st30814', updatedAt: '02/19/2022 04:07 AM', status: 'Pending', userIds: ['ops1001', 'ops1002'], roles: ['Operations'], toolsAndReports: ['Match Workbench'] }
];
const TRIGGERS: OpsLoadTrigger[] = [
  { id: 't-1', opsId: 'R-10021', opsName: 'US Equity Daily Ops', triggerType: 'Manual', value: 'Daily', loadStatus: 'Completed', matchLoadStatus: 'Loaded', updatedBy: 'sso0204', updatedAt: '10/30/2026 09:15 AM', requestedBy: 'sso0204' },
  { id: 't-2', opsId: 'R-10022', opsName: 'LATAM Cash Ops', triggerType: 'Scheduled', value: 'Hourly', loadStatus: 'Pending', matchLoadStatus: 'Not Started', updatedBy: 'dm11327', updatedAt: '10/30/2026 08:42 AM', requestedBy: 'dm11327' },
  { id: 't-3', opsId: 'R-10023', opsName: 'Fixed Income Positions', triggerType: 'Manual', value: 'One-time', loadStatus: 'Failed', matchLoadStatus: 'Not Loaded', updatedBy: 'st30814', updatedAt: '10/29/2026 05:30 PM', requestedBy: 'st30814' }
];

@Injectable()
export class GroupingApprovalsMockRepository implements GroupingApprovalsRepository {
  private groups = structuredClone(GROUPS);
  private triggers = structuredClone(TRIGGERS);
  async getGroups(): Promise<EntitlementGroup[]> { return structuredClone(this.groups); }
  async getTriggers(): Promise<OpsLoadTrigger[]> { return structuredClone(this.triggers); }
  async createGroup(draft: Omit<EntitlementGroup, 'id' | 'updatedBy' | 'updatedAt'>): Promise<EntitlementGroup> {
    if (this.groups.some(g => g.groupName.toLowerCase() === draft.groupName.toLowerCase())) throw new Error('A group with this name already exists.');
    const created: EntitlementGroup = { ...draft, id: 'g-' + Date.now(), updatedBy: 'demo.user', updatedAt: new Date().toLocaleString() };
    this.groups = [created, ...this.groups];
    return structuredClone(created);
  }
  async saveGroup(groupId: string, update: GroupUpdate): Promise<EntitlementGroup> {
    const index = this.groups.findIndex(group => group.id === groupId);
    if (index < 0) throw new Error(`Entitlement group ${groupId} was not found`);
    this.groups[index] = { ...this.groups[index], ...update, updatedBy: 'demo.user', updatedAt: new Date().toLocaleString() };
    return structuredClone(this.groups[index]);
  }
  async deleteGroup(groupId: string): Promise<void> {
    const target = this.groups.find(group => group.id === groupId);
    if (!target) throw new Error('The selected group no longer exists.');
    this.groups = this.groups.filter(group => group.id !== groupId);
  }
  async decideGroup(groupId: string, decision: ApprovalDecision, comment: string): Promise<EntitlementGroup> {
    const index = this.groups.findIndex(group => group.id === groupId);
    if (index < 0) throw new Error('The selected group no longer exists.');
    if (this.groups[index].status !== 'Pending') throw new Error('Only pending groups can be approved or rejected.');
    this.groups[index] = {
      ...this.groups[index],
      status: decision === 'Approved' ? 'Active' : 'Rejected',
      approvalComment: comment,
      approvedBy: 'demo.approver',
      approvedAt: new Date().toLocaleString(),
      updatedBy: 'demo.approver',
      updatedAt: new Date().toLocaleString()
    };
    return structuredClone(this.groups[index]);
  }
}
