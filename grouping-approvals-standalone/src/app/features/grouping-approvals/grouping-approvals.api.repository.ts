import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../core/api/api-client.service';
import { EntitlementGroup, ReconLoadTrigger, GroupUpdate } from './grouping-approvals.models';
import { GroupingApprovalsRepository } from './grouping-approvals.repository';

@Injectable()
export class GroupingApprovalsApiRepository implements GroupingApprovalsRepository {
  private readonly api = inject(ApiClientService);
  getGroups(): Promise<EntitlementGroup[]> { return this.api.request('groupsList'); }
  getTriggers(): Promise<ReconLoadTrigger[]> { return this.api.request('triggersList'); }
  createGroup(group: Omit<EntitlementGroup, 'id' | 'updatedBy' | 'updatedAt'>): Promise<EntitlementGroup> {
    return this.api.request('groupsCreate', { body: group });
  }
  saveGroup(groupId: string, update: GroupUpdate): Promise<EntitlementGroup> {
    return this.api.request('groupsUpdate', { pathParams: { id: groupId }, body: update });
  }
  deleteGroup(groupId: string): Promise<void> {
    return this.api.request('groupsDelete', { pathParams: { id: groupId } });
  }
}
