import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GROUPING_APPROVALS_CONFIG } from './grouping-approvals.config';
import { EntitlementGroup, ReconLoadTrigger, GroupUpdate } from './grouping-approvals.models';
import { GROUPING_APPROVALS_REPOSITORY } from './grouping-approvals.repository';
import { GroupingApprovalsMockRepository } from './grouping-approvals.mock.repository';

@Component({
  selector: 'app-grouping-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [{ provide: GROUPING_APPROVALS_REPOSITORY, useClass: GroupingApprovalsMockRepository }],
  templateUrl: './grouping-approvals.component.html',
  styleUrl: './grouping-approvals.component.scss'
})
export class GroupingApprovalsComponent implements OnInit {
  readonly config = GROUPING_APPROVALS_CONFIG;
  private readonly repository = inject(GROUPING_APPROVALS_REPOSITORY);
  readonly activeTab = signal('groups');
  readonly groups = signal<EntitlementGroup[]>([]);
  readonly triggers = signal<ReconLoadTrigger[]>([]);
  readonly searchText = signal('');
  readonly selectedGroup = signal<EntitlementGroup | null>(null);
  readonly dialogMode = signal<'users' | 'roles' | null>(null);
  readonly busy = signal(false);
  readonly errorMessage = signal('');
  userIdsText = '';
  rolesText = '';
  descriptionDraft = '';
  ownerDraft = '';
  approversDraft = '';

  readonly filteredGroups = computed(() => {
    const q = this.searchText().trim().toLowerCase();
    return q ? this.groups().filter(g => [g.groupName, g.description, g.owner, ...g.userIds].join(' ').toLowerCase().includes(q)) : this.groups();
  });
  readonly filteredTriggers = computed(() => {
    const q = this.searchText().trim().toLowerCase();
    return q ? this.triggers().filter(t => Object.values(t).join(' ').toLowerCase().includes(q)) : this.triggers();
  });

  async ngOnInit(): Promise<void> { await this.loadData(); }

  async loadData(): Promise<void> {
    this.busy.set(true); this.errorMessage.set('');
    try {
      const [groups, triggers] = await Promise.all([this.repository.getGroups(), this.repository.getTriggers()]);
      this.groups.set(groups); this.triggers.set(triggers);
    } catch (e) {
      this.errorMessage.set(e instanceof Error ? e.message : 'Unable to load data.');
    } finally { this.busy.set(false); }
  }

  setTab(id: string): void { this.activeTab.set(id); this.searchText.set(''); }

  openDialog(group: EntitlementGroup, mode: 'users' | 'roles'): void {
    this.selectedGroup.set(group); this.dialogMode.set(mode);
    this.userIdsText = group.userIds.join('\n'); this.rolesText = group.roles.join('\n');
    this.descriptionDraft = group.description; this.ownerDraft = group.owner;
    this.approversDraft = group.approvers.join(', ');
  }

  closeDialog(): void { this.dialogMode.set(null); this.selectedGroup.set(null); }

  async saveDialog(): Promise<void> {
    const group = this.selectedGroup(); if (!group) return;
    const update: GroupUpdate = {
      description: this.descriptionDraft.trim(), owner: this.ownerDraft.trim(),
      approvers: this.approversDraft.split(',').map(x => x.trim()).filter(Boolean),
      userIds: this.userIdsText.split(/[\n,;]/).map(x => x.trim()).filter(Boolean),
      roles: this.rolesText.split(/[\n,;]/).map(x => x.trim()).filter(Boolean)
    };
    this.busy.set(true);
    try {
      const saved = await this.repository.saveGroup(group.id, update);
      this.groups.update(rows => rows.map(row => row.id === saved.id ? saved : row));
      this.closeDialog();
    } catch (e) { this.errorMessage.set(e instanceof Error ? e.message : 'Unable to save changes.'); }
    finally { this.busy.set(false); }
  }

  exportGroups(): void {
    const headers = ['Group Name', 'Description', 'Owner', 'Approvers', 'Recon Selection', 'Updated By', 'Updated Date'];
    const rows = this.filteredGroups().map(g => [g.groupName, g.description, g.owner, g.approvers.join('; '), g.reconSelection, g.updatedBy, g.updatedAt]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = 'entitlement-groups.csv'; a.click(); URL.revokeObjectURL(url);
  }

  trackById(_index: number, item: { id: string }): string { return item.id; }
}