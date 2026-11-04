import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GroupingApprovalsPageConfig } from './grouping-approvals.config';
import { GroupingApprovalsDataService } from './grouping-approvals-data.service';
import { ApprovalScreenId, EntitlementGroup, ReconTrigger } from './grouping-approvals.models';

type DialogMode = 'create' | 'edit' | 'users' | 'roles' | 'view' | null;
type TriggerFilterKey = 'reconId' | 'reconName' | 'triggerType' | 'loadStatus' | 'updatedBy';

@Component({
  selector: 'app-grouping-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grouping-approvals.component.html',
  styleUrls: ['./grouping-approvals.component.scss']
})
export class GroupingApprovalsComponent {
  readonly config = new GroupingApprovalsPageConfig();
  readonly data = inject(GroupingApprovalsDataService);
  readonly activeScreen = signal<ApprovalScreenId>('groups');
  readonly searchText = signal('');
  readonly selectedGroupId = signal('G-1004');
  readonly dialogMode = signal<DialogMode>(null);
  readonly toast = signal('');
  readonly triggerFilters = signal({ reconId: '', reconName: '', triggerType: '', loadStatus: '', updatedBy: '' });
  readonly draft = signal<EntitlementGroup>(this.emptyGroup());
  readonly userIdsDraft = signal('');
  readonly roleIdsDraft = signal<string[]>([]);
  readonly reconIdsDraft = signal('');
  readonly selectedTrigger = signal<ReconTrigger | null>(null);

  readonly currentScreen = computed(() => this.config.getScreen(this.activeScreen()));
  readonly selectedGroup = computed(() => this.data.groups().find(group => group.id === this.selectedGroupId()) ?? this.data.groups()[0] ?? null);
  readonly draftUserIds = computed(() => this.userIdsDraft().split(/[\\s,;]+/).map(id => id.trim()).filter(Boolean));
  readonly filteredGroups = computed(() => {
    const query = this.searchText().trim().toLowerCase();
    return this.data.groups().filter(group => !query || [group.name, group.description, group.owner, ...group.approvers].join(' ').toLowerCase().includes(query));
  });
  readonly filteredTriggers = computed(() => {
    const filters = this.triggerFilters();
    return this.data.triggers().filter(trigger =>
      (!filters.reconId || trigger.reconId.toLowerCase().includes(filters.reconId.toLowerCase())) &&
      (!filters.reconName || trigger.reconName.toLowerCase().includes(filters.reconName.toLowerCase())) &&
      (!filters.triggerType || trigger.triggerType === filters.triggerType) &&
      (!filters.loadStatus || trigger.loadStatus === filters.loadStatus) &&
      (!filters.updatedBy || trigger.updatedBy.toLowerCase().includes(filters.updatedBy.toLowerCase()))
    );
  });

  openCreate(): void { this.draft.set(this.emptyGroup()); this.dialogMode.set('create'); }
  openEdit(group: EntitlementGroup): void {
    this.draft.set({ ...group, approvers: [...group.approvers], userIds: [...group.userIds], roleIds: [...group.roleIds], reconIds: [...group.reconIds] });
    this.dialogMode.set('edit');
  }
  openUsers(group: EntitlementGroup): void {
    this.selectedGroupId.set(group.id);
    this.userIdsDraft.set(group.userIds.join('\\n'));
    this.dialogMode.set('users');
    this.activeScreen.set('users');
  }
  openRoles(group: EntitlementGroup): void {
    this.selectedGroupId.set(group.id);
    this.roleIdsDraft.set([...group.roleIds]);
    this.reconIdsDraft.set(group.reconIds.join(', '));
    this.activeScreen.set('roles');
  }
  openView(group: EntitlementGroup): void { this.draft.set({ ...group }); this.dialogMode.set('view'); }

  updateDraftName(value: string): void { this.draft.update(group => ({ ...group, name: value })); }
  updateDraftOwner(value: string): void { this.draft.update(group => ({ ...group, owner: value })); }
  updateDraftDescription(value: string): void { this.draft.update(group => ({ ...group, description: value })); }
  updateDraftApprovers(value: string): void {
    this.draft.update(group => ({ ...group, approvers: value.split(',').map(id => id.trim()).filter(Boolean) }));
  }
  updateDraftReconSelection(value: string): void { this.draft.update(group => ({ ...group, reconSelection: value })); }
  removeDraftUser(userId: string): void {
    this.userIdsDraft.set(this.draftUserIds().filter(id => id !== userId).join('\\n'));
  }
  toggleRole(roleId: string, checked: boolean): void {
    this.roleIdsDraft.update(ids => checked ? [...new Set([...ids, roleId])] : ids.filter(id => id !== roleId));
  }
  setReconScope(allRecons: boolean): void { if (allRecons) this.reconIdsDraft.set(''); }

  saveGroup(): void {
    const group = this.draft();
    if (!group.name.trim()) return;
    this.data.saveGroup({ ...group, updatedBy: 'current.user', updatedAt: new Date().toLocaleString() });
    this.selectedGroupId.set(group.id);
    this.closeDialog();
    this.notify('Group configuration saved');
  }
  saveUsers(): void {
    const ids = [...new Set(this.draftUserIds())];
    this.data.saveUsers(this.selectedGroupId(), ids);
    this.closeDialog();
    this.notify('Group users updated');
  }
  saveRoles(): void {
    const reconIds = this.reconIdsDraft().split(/[\\s,;]+/).map(id => id.trim()).filter(Boolean);
    this.data.saveRoles(this.selectedGroupId(), this.roleIdsDraft(), reconIds);
    this.notify('Role and recon entitlements saved');
  }
  runGroupAction(action: string, group: EntitlementGroup): void {
    switch (action) {
      case 'view': this.openView(group); break;
      case 'edit': this.openEdit(group); break;
      case 'manage-users': this.openUsers(group); break;
      case 'configure-roles': this.openRoles(group); break;
      case 'delete':
        if (confirm('Delete entitlement group "' + group.name + '"? This action cannot be undone.')) {
          this.data.deleteGroup(group.id);
          this.notify('Entitlement group deleted');
        }
        break;
    }
  }
  updateTriggerFilter(key: TriggerFilterKey, value: string): void {
    this.triggerFilters.update(filters => ({ ...filters, [key]: value }));
  }
  clearTriggerFilters(): void {
    this.triggerFilters.set({ reconId: '', reconName: '', triggerType: '', loadStatus: '', updatedBy: '' });
  }
  closeDialog(): void { this.dialogMode.set(null); }
  setScreen(screen: ApprovalScreenId): void { this.activeScreen.set(screen); this.searchText.set(''); }
  selectGroup(group: EntitlementGroup): void { this.selectedGroupId.set(group.id); }
  showTrigger(trigger: ReconTrigger): void { this.selectedTrigger.set(trigger); }
  closeTrigger(): void { this.selectedTrigger.set(null); }

  notify(message: string): void {
    this.toast.set(message);
    setTimeout(() => this.toast.set(''), 2800);
  }
  private emptyGroup(): EntitlementGroup {
    return { id: 'G-' + Math.floor(1000 + Math.random() * 8999), name: '', description: '', owner: '', approvers: [], reconSelection: 'All Recons', allEntities: 0, updatedBy: 'current.user', updatedAt: new Date().toLocaleString(), status: 'Active', userIds: [], roleIds: [], reconIds: [] };
  }
}