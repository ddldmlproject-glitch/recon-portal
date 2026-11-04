import { Injectable, signal } from '@angular/core';
import { EntitlementGroup, ReconTrigger, RoleDefinition } from './grouping-approvals.models';

@Injectable({ providedIn: 'root' })
export class GroupingApprovalsDataService {
  // Demo repository boundary. Replace this class with HttpClient-backed repositories
  // when the Java service contracts are ready; screens consume the same typed models.
  readonly groups = signal<EntitlementGroup[]>([
    { id: 'G-1001', name: 'LATAM VIEW ONLY FOM', description: 'ReadOnly: User access to view matched items', owner: 'st30839', approvers: ['st29418', 'st30127'], reconSelection: 'All Recons', allEntities: 1, updatedBy: 'ss00204', updatedAt: '05/22/2025 04:41 AM', status: 'Active', userIds: ['GR30775', 'SA30754', 'jr14112'], roleIds: ['VIEW_ONLY'], reconIds: [] },
    { id: 'G-1002', name: 'TLM_STRD_OPSREC_SO_NA2', description: 'ReadWrite: OPS user can match items', owner: 'st29418', approvers: ['st30839'], reconSelection: 'Recon IDs', allEntities: 0, updatedBy: 'dm11327', updatedAt: '02/19/2022 04:06 AM', status: 'Active', userIds: ['rk76239', 'sc98371'], roleIds: ['CHECKER'], reconIds: ['R-100', 'R-102'] },
    { id: 'G-1003', name: 'TLM_STRD_OPSREC_UNLIMITED_NET_HKO', description: 'ReadWrite: OPS user can match items (unlimited)', owner: 'st30127', approvers: ['st29418'], reconSelection: 'All Recons', allEntities: 0, updatedBy: 'ss20606', updatedAt: '02/19/2022 04:07 AM', status: 'Active', userIds: ['ms25678', 'jr14112'], roleIds: ['MAKER', 'CHECKER'], reconIds: [] },
    { id: 'G-1004', name: '1001_CHECKER', description: 'ReadWrite: User can add break comment', owner: 'st51579', approvers: ['st30839'], reconSelection: 'Recon IDs', allEntities: 0, updatedBy: 'st51579', updatedAt: '01/22/2026 08:32 AM', status: 'Active', userIds: ['GR30775', 'SA30754', 'jr14112', 'ms25678', 'rk76239', 'sc98371'], roleIds: ['CHECKER'], reconIds: ['R-100'] },
    { id: 'G-1005', name: '1001_MAKER', description: 'Default system group 1001_MAKER', owner: 'st91333', approvers: ['st51579'], reconSelection: 'All Recons', allEntities: 0, updatedBy: 'st91333', updatedAt: '03/19/2016 08:52 AM', status: 'Active', userIds: ['st91333'], roleIds: ['MAKER'], reconIds: [] },
    { id: 'G-1006', name: '1001_READONLY', description: 'Default system group 1001_READONLY', owner: 'sh86409', approvers: ['st91333'], reconSelection: 'All Recons', allEntities: 0, updatedBy: 'sh86409', updatedAt: '04/25/2024 06:55 AM', status: 'Active', userIds: ['sh86409'], roleIds: ['VIEW_ONLY'], reconIds: [] }
  ]);

  readonly roles = signal<RoleDefinition[]>([
    { id: 'VIEW_ONLY', name: 'View Only', description: 'Read-only access to assigned recons.', permissions: ['View recons', 'View reports'] },
    { id: 'MAKER', name: 'Maker', description: 'Create and submit recon actions.', permissions: ['View recons', 'Create actions', 'Submit for approval'] },
    { id: 'CHECKER', name: 'Checker', description: 'Review and approve submitted actions.', permissions: ['View recons', 'Review actions', 'Approve actions', 'Add break comments'] }
  ]);

  readonly triggers = signal<ReconTrigger[]>([
    { id: 'TR-301', reconId: 'R-100', reconName: 'LATAM Daily Cash Recon', triggerType: 'SCHEDULED', value: 'DAILY', loadStatus: 'COMPLETED', matchLoadStatus: 'COMPLETED', updatedBy: 'st30839', updatedAt: '11/03/2026 04:41 AM' },
    { id: 'TR-302', reconId: 'R-102', reconName: 'North America Equity Recon', triggerType: 'MANUAL', value: 'ON_DEMAND', loadStatus: 'IN_PROGRESS', matchLoadStatus: 'PENDING', updatedBy: 'dm11327', updatedAt: '11/03/2026 05:12 AM' },
    { id: 'TR-303', reconId: 'R-108', reconName: 'EMEA Fixed Income Recon', triggerType: 'SCHEDULED', value: 'HOURLY', loadStatus: 'FAILED', matchLoadStatus: 'NOT_STARTED', updatedBy: 'ss20606', updatedAt: '11/02/2026 11:30 PM' },
    { id: 'TR-304', reconId: 'R-114', reconName: 'Global Payments Recon', triggerType: 'EVENT', value: 'ON_UPDATE', loadStatus: 'COMPLETED', matchLoadStatus: 'COMPLETED', updatedBy: 'st51579', updatedAt: '11/02/2026 09:08 PM' }
  ]);

  saveGroup(group: EntitlementGroup): void {
    this.groups.update(items => {
      const exists = items.some(item => item.id === group.id);
      return exists ? items.map(item => item.id === group.id ? { ...group } : item) : [{ ...group }, ...items];
    });
  }

  deleteGroup(groupId: string): void {
    this.groups.update(items => items.filter(item => item.id !== groupId));
  }

  saveUsers(groupId: string, userIds: string[]): void {
    this.groups.update(items => items.map(item => item.id === groupId ? { ...item, userIds: [...userIds], updatedAt: new Date().toLocaleString() } : item));
  }

  saveRoles(groupId: string, roleIds: string[], reconIds: string[]): void {
    this.groups.update(items => items.map(item => item.id === groupId ? { ...item, roleIds: [...roleIds], reconIds: [...reconIds], reconSelection: reconIds.length ? 'Recon IDs' : 'All Recons', updatedAt: new Date().toLocaleString() } : item));
  }
}
