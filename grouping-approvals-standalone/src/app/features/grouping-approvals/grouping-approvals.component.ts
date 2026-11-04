import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GROUPING_APPROVALS_CONFIG } from './grouping-approvals.config';
import { EntitlementGroup, ReconLoadTrigger, GroupUpdate } from './grouping-approvals.models';
import { GROUPING_APPROVALS_REPOSITORY } from './grouping-approvals.repository';
import { GroupingApprovalsMockRepository } from './grouping-approvals.mock.repository';

type DialogMode = 'create' | 'edit';
type Section = 'recons' | 'users' | 'roles' | 'tools';
@Component({
  selector: 'app-grouping-approvals', standalone: true, imports: [CommonModule, FormsModule],
  providers: [{ provide: GROUPING_APPROVALS_REPOSITORY, useClass: GroupingApprovalsMockRepository }],
  templateUrl: './grouping-approvals.component.html', styleUrl: './grouping-approvals.component.scss'
})
export class GroupingApprovalsComponent implements OnInit {
  readonly config = GROUPING_APPROVALS_CONFIG;
  private readonly repository = inject(GROUPING_APPROVALS_REPOSITORY);
  readonly activeTab = signal('groups');
  readonly groups = signal<EntitlementGroup[]>([]);
  readonly triggers = signal<ReconLoadTrigger[]>([]);
  readonly searchText = signal('');
  readonly selectedGroup = signal<EntitlementGroup | null>(null);
  readonly dialogMode = signal<DialogMode | null>(null);
  readonly activeSection = signal<Section>('recons');
  readonly busy = signal(false);
  readonly errorMessage = signal('');
  groupNameDraft = ''; descriptionDraft = ''; ownerDraft = ''; approversDraft = '';
  userIdsText = ''; rolesText = ''; toolsText = ''; reconIdsText = '';
  reconSelectionDraft: 'All Recons' | 'Recon IDs' = 'All Recons';
  allEntitiesDraft = true;
  statusDraft: 'Active' | 'Inactive' | 'Pending' = 'Active';

  readonly filteredGroups = computed(() => {
    const q = this.searchText().trim().toLowerCase();
    return q ? this.groups().filter(g => [g.groupName, g.description, g.owner, ...g.userIds, ...g.roles].join(' ').toLowerCase().includes(q)) : this.groups();
  });
  readonly filteredTriggers = computed(() => {
    const q = this.searchText().trim().toLowerCase();
    return q ? this.triggers().filter(t => Object.values(t).join(' ').toLowerCase().includes(q)) : this.triggers();
  });
  async ngOnInit(): Promise<void> { await this.loadData(); }
  async loadData(): Promise<void> {
    this.busy.set(true); this.errorMessage.set('');
    try { const [groups, triggers] = await Promise.all([this.repository.getGroups(), this.repository.getTriggers()]); this.groups.set(groups); this.triggers.set(triggers); }
    catch (e) { this.errorMessage.set(e instanceof Error ? e.message : 'Unable to load data.'); }
    finally { this.busy.set(false); }
  }
  setTab(id: string): void { this.activeTab.set(id); this.searchText.set(''); }
  openCreateGroup(): void {
    this.selectedGroup.set(null); this.dialogMode.set('create'); this.activeSection.set('recons');
    this.groupNameDraft = ''; this.descriptionDraft = ''; this.ownerDraft = ''; this.approversDraft = '';
    this.userIdsText = ''; this.rolesText = ''; this.toolsText = ''; this.reconIdsText = '';
    this.reconSelectionDraft = 'All Recons'; this.allEntitiesDraft = true; this.statusDraft = 'Active';
  }
  openEditGroup(group: EntitlementGroup, section: Section = 'recons'): void {
    this.selectedGroup.set(group); this.dialogMode.set('edit'); this.activeSection.set(section);
    this.groupNameDraft = group.groupName; this.descriptionDraft = group.description; this.ownerDraft = group.owner;
    this.approversDraft = group.approvers.join(', '); this.userIdsText = group.userIds.join('\n');
    this.rolesText = group.roles.join('\n'); this.toolsText = group.toolsAndReports.join('\n');
    this.reconSelectionDraft = group.reconSelection; this.allEntitiesDraft = group.allEntities === 1;
    this.reconIdsText = ''; this.statusDraft = group.status;
  }
  closeDialog(): void { this.dialogMode.set(null); this.selectedGroup.set(null); }
  private list(value: string): string[] { return value.split(/[\n,;]/).map(x => x.trim()).filter(Boolean); }
  async saveDialog(): Promise<void> {
    if (!this.groupNameDraft.trim() || !this.ownerDraft.trim()) { this.errorMessage.set('Group name and owner are required.'); return; }
    const data = {
      groupName: this.groupNameDraft.trim(), description: this.descriptionDraft.trim(), owner: this.ownerDraft.trim(),
      approvers: this.list(this.approversDraft), reconSelection: this.reconSelectionDraft, allEntities: this.allEntitiesDraft ? 1 : 0,
      status: this.statusDraft, userIds: this.list(this.userIdsText), roles: this.list(this.rolesText), toolsAndReports: this.list(this.toolsText)
    };
    this.busy.set(true); this.errorMessage.set('');
    try {
      if (this.dialogMode() === 'create') {
        const saved = await this.repository.createGroup({ ...data, updatedBy: '', updatedAt: '' } as Omit<EntitlementGroup, 'id' | 'updatedBy' | 'updatedAt'>);
        this.groups.update(rows => [saved, ...rows]);
      } else {
        const group = this.selectedGroup(); if (!group) return;
        const update: GroupUpdate = { description: data.description, owner: data.owner, approvers: data.approvers, userIds: data.userIds, roles: data.roles, toolsAndReports: data.toolsAndReports, reconSelection: data.reconSelection, allEntities: data.allEntities, status: data.status };
        const saved = await this.repository.saveGroup(group.id, update);
        this.groups.update(rows => rows.map(row => row.id === saved.id ? saved : row));
      }
      this.closeDialog();
    } catch (e) { this.errorMessage.set(e instanceof Error ? e.message : 'Unable to save group.'); }
    finally { this.busy.set(false); }
  }
  exportGroups(): void {
    const headers = ['Group Name','Description','Owner','Approvers','Recon Selection','Users','Roles','Tools and Reports','Status','Updated By','Updated Date'];
    const rows = this.filteredGroups().map(g => [g.groupName,g.description,g.owner,g.approvers.join('; '),g.reconSelection,g.userIds.join('; '),g.roles.join('; '),g.toolsAndReports.join('; '),g.status,g.updatedBy,g.updatedAt]);
    const csv = [headers,...rows].map(row => row.map(v => `"${String(v ?? '').replaceAll('"','""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = 'entitlement-groups.csv'; a.click(); URL.revokeObjectURL(url);
  }
  trackById(_index: number, item: { id: string }): string { return item.id; }
}
