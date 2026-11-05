import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ColDef, GridOptions, ICellRendererParams } from 'ag-grid-community';
import { DynamicScreenComponent } from '../../shared/components/dynamic-screen/dynamic-screen.component';
import { DynamicFormComponent } from '../../shared/components/dynamic-form/dynamic-form.component';
import { ScreenConfig, FieldConfig } from '../../core/config/screen-config.models';
import { ScreenRegistryService } from '../../core/engine/screen-registry.service';
import { GROUPING_APPROVALS_CONFIG } from './grouping-approvals.config';
import { GROUPING_APPROVALS_SCREENS } from './grouping-approvals.screen-config';
import { EntitlementGroup, ReconLoadTrigger, GroupUpdate, ApprovalDecision } from './grouping-approvals.models';
import { GROUPING_APPROVALS_REPOSITORY } from './grouping-approvals.repository';

type DialogMode = 'create' | 'edit';

@Component({
  selector: 'app-grouping-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicScreenComponent, DynamicFormComponent],
  templateUrl: './grouping-approvals.component.html',
  styleUrl: './grouping-approvals.component.scss'
})
export class GroupingApprovalsComponent implements OnInit {
  readonly config = GROUPING_APPROVALS_CONFIG;
  readonly screens = GROUPING_APPROVALS_SCREENS;
  private readonly repository = inject(GROUPING_APPROVALS_REPOSITORY);
  private readonly screenRegistry = inject(ScreenRegistryService);
  readonly groupScreen: ScreenConfig<EntitlementGroup>;
  readonly triggerScreen: ScreenConfig<ReconLoadTrigger>;

  readonly activeTab = signal('groups');
  readonly groups = signal<EntitlementGroup[]>([]);
  readonly triggers = signal<ReconLoadTrigger[]>([]);
  readonly searchText = signal('');
  readonly selectedGroup = signal<EntitlementGroup | null>(null);
  readonly dialogMode = signal<DialogMode | null>(null);
  readonly busy = signal(false);
  readonly errorMessage = signal('');
  readonly approvalComment = signal('');
  readonly approvalTarget = signal<EntitlementGroup | null>(null);

  readonly groupFormFields: FieldConfig[] = [
    { key: 'groupName', label: 'Group Name', type: 'text', required: true, placeholder: 'Enter unique group name' },
    { key: 'owner', label: 'Group Owner', type: 'text', required: true, placeholder: 'Enter owner user ID' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the group purpose' },
    { key: 'approvers', label: 'Group Approvers', type: 'textarea', placeholder: 'Enter IDs separated by commas or new lines' },
    { key: 'reconSelection', label: 'Recon Selection', type: 'select', defaultValue: 'All Recons', options: [{ label: 'All Recons', value: 'All Recons' }, { label: 'Specific Recon IDs', value: 'Recon IDs' }] },
    { key: 'reconIds', label: 'Recon IDs', type: 'textarea', placeholder: 'R-10021, R-10022' , visibleWhen: { field: 'reconSelection', equals: 'Recon IDs' } },
    { key: 'allEntities', label: 'All Entities', type: 'checkbox', defaultValue: true },
    { key: 'status', label: 'Status', type: 'select', defaultValue: 'Pending', options: [{ label: 'Pending approval', value: 'Pending' }, { label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }] },
    { key: 'userIds', label: 'Assigned User IDs', type: 'textarea', placeholder: 'One user ID per line or comma separated' },
    { key: 'roles', label: 'Assigned Roles', type: 'textarea', placeholder: 'Maker, Checker, Reviewer' },
    { key: 'toolsAndReports', label: 'Tools and Reports', type: 'textarea', placeholder: 'Recon Summary, Break Report' }
  ];

  readonly filteredGroups = computed(() => {
    const q = this.searchText().trim().toLowerCase();
    const rows = this.groups();
    return q ? rows.filter(g => [g.groupName, g.description, g.owner, ...g.userIds, ...g.roles, ...g.reconIds].join(' ').toLowerCase().includes(q)) : rows;
  });
  readonly filteredTriggers = computed(() => {
    const q = this.searchText().trim().toLowerCase();
    return q ? this.triggers().filter(t => Object.values(t).join(' ').toLowerCase().includes(q)) : this.triggers();
  });
  readonly pendingGroups = computed(() => this.groups().filter(group => group.status === 'Pending'));

  readonly groupColumnDefs: ColDef<EntitlementGroup>[] = [
    ...this.screens[0].grid!.columns as ColDef<EntitlementGroup>[],
    {
      headerName: 'Actions', colId: 'rowActions', pinned: 'right', sortable: false, filter: false,
      resizable: false, minWidth: 310, flex: 0,
      cellRenderer: (params: ICellRendererParams<EntitlementGroup>) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'ga-grid-actions';
        const actions: { label: string; run: () => void; disabled?: boolean }[] = [
          { label: 'Edit', run: () => params.data && this.openEditGroup(params.data) },
          { label: 'Delete', run: () => params.data && void this.deleteGroup(params.data) },
          { label: 'Approve', run: () => params.data && this.openApproval(params.data, 'Approved'), disabled: params.data?.status !== 'Pending' },
          { label: 'Reject', run: () => params.data && this.openApproval(params.data, 'Rejected'), disabled: params.data?.status !== 'Pending' }
        ];
        for (const action of actions) {
          const button = document.createElement('button');
          button.type = 'button'; button.className = 'ga-grid-action'; button.textContent = action.label;
          button.disabled = !!action.disabled;
          button.addEventListener('click', action.run);
          wrapper.append(button);
        }
        return wrapper;
      }
    }
  ];
  readonly triggerColumnDefs: ColDef<ReconLoadTrigger>[] = this.screens[1].grid!.columns as ColDef<ReconLoadTrigger>[];
  readonly gridOptions: GridOptions = {
    animateRows: true, pagination: true, paginationPageSize: 20,
    paginationPageSizeSelector: [10, 20, 50, 100],
    rowSelection: { mode: 'multiRow' }, suppressCellFocus: false
  };

  constructor() {
    this.screenRegistry.registerMany(this.screens);
    this.groupScreen = this.screenRegistry.get<EntitlementGroup>('groups');
    this.triggerScreen = this.screenRegistry.get<ReconLoadTrigger>('triggers');
  }

  async ngOnInit(): Promise<void> { await this.loadData(); }

  async loadData(): Promise<void> {
    this.busy.set(true); this.errorMessage.set('');
    try {
      const [groups, triggers] = await Promise.all([this.repository.getGroups(), this.repository.getTriggers()]);
      this.groups.set(groups); this.triggers.set(triggers);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load data.');
    } finally { this.busy.set(false); }
  }

  setTab(id: string): void { this.activeTab.set(id); this.searchText.set(''); }
  openCreateGroup(): void { this.selectedGroup.set(null); this.dialogMode.set('create'); this.errorMessage.set(''); }
  openEditGroup(group: EntitlementGroup): void { this.selectedGroup.set(group); this.dialogMode.set('edit'); this.errorMessage.set(''); }
  closeDialog(): void { this.dialogMode.set(null); this.selectedGroup.set(null); }

  private parseList(value: unknown): string[] {
    return String(value ?? '').split(/[\\n,;]/).map(item => item.trim()).filter(Boolean);
  }

  private formValue(group?: EntitlementGroup): Record<string, unknown> {
    return {
      groupName: group?.groupName ?? '', owner: group?.owner ?? '', description: group?.description ?? '',
      approvers: group?.approvers.join(', ') ?? '', reconSelection: group?.reconSelection ?? 'All Recons',
      reconIds: group?.reconIds?.join(', ') ?? '', allEntities: group ? group.allEntities === 1 : true,
      status: group?.status ?? 'Pending', userIds: group?.userIds.join('\\n') ?? '',
      roles: group?.roles.join('\\n') ?? '', toolsAndReports: group?.toolsAndReports.join('\\n') ?? ''
    };
  }

  async saveGroupForm(value: Record<string, unknown>): Promise<void> {
    const groupName = String(value['groupName'] ?? '').trim();
    const owner = String(value['owner'] ?? '').trim();
    if (!groupName || !owner) { this.errorMessage.set('Group name and owner are required.'); return; }
    const selected = this.selectedGroup();
    const status = (value['status'] === 'Active' || value['status'] === 'Inactive' ? value['status'] : 'Pending');
    const data = {
      groupName, description: String(value['description'] ?? '').trim(), owner,
      approvers: this.parseList(value['approvers']),
      reconSelection: value['reconSelection'] === 'Recon IDs' ? 'Recon IDs' as const : 'All Recons' as const,
      reconIds: this.parseList(value['reconIds']), allEntities: value['allEntities'] ? 1 : 0,
      status, userIds: this.parseList(value['userIds']), roles: this.parseList(value['roles']),
      toolsAndReports: this.parseList(value['toolsAndReports'])
    };
    this.busy.set(true); this.errorMessage.set('');
    try {
      if (!selected) {
        const created = await this.repository.createGroup(data);
        this.groups.update(rows => [created, ...rows]);
      } else {
        const update: GroupUpdate = {
          description: data.description, owner: data.owner, approvers: data.approvers,
          userIds: data.userIds, roles: data.roles, toolsAndReports: data.toolsAndReports,
          reconSelection: data.reconSelection, reconIds: data.reconIds,
          allEntities: data.allEntities, status: data.status
        };
        const saved = await this.repository.saveGroup(selected.id, update);
        this.groups.update(rows => rows.map(row => row.id === saved.id ? saved : row));
      }
      this.closeDialog();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to save group.');
    } finally { this.busy.set(false); }
  }

  async deleteGroup(group: EntitlementGroup): Promise<void> {
    if (!window.confirm(`Delete entitlement group "${group.groupName}"? This cannot be undone.`)) return;
    this.busy.set(true); this.errorMessage.set('');
    try {
      await this.repository.deleteGroup(group.id);
      this.groups.update(rows => rows.filter(row => row.id !== group.id));
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to delete group.');
    } finally { this.busy.set(false); }
  }

  openApproval(group: EntitlementGroup, decision: ApprovalDecision): void {
    this.approvalTarget.set(group);
    this.approvalComment.set('');
    this.approvalDecision.set(decision);
  }
  readonly approvalDecision = signal<ApprovalDecision>('Approved');
  closeApproval(): void { this.approvalTarget.set(null); this.approvalComment.set(''); }
  async submitApproval(): Promise<void> {
    const group = this.approvalTarget();
    if (!group) return;
    if (this.approvalDecision() === 'Rejected' && !this.approvalComment().trim()) {
      this.errorMessage.set('A reason is required when rejecting a group.'); return;
    }
    this.busy.set(true); this.errorMessage.set('');
    try {
      const saved = await this.repository.decideGroup(group.id, this.approvalDecision(), this.approvalComment().trim());
      this.groups.update(rows => rows.map(row => row.id === saved.id ? saved : row));
      this.closeApproval();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to process approval.');
    } finally { this.busy.set(false); }
  }

  exportGroups(): void {
    const headers = ['Group Name','Description','Owner','Approvers','Recon Selection','Recon IDs','Users','Roles','Tools and Reports','Status','Updated By','Updated Date'];
    const rows = this.filteredGroups().map(g => [g.groupName,g.description,g.owner,g.approvers.join('; '),g.reconSelection,g.reconIds.join('; '),g.userIds.join('; '),g.roles.join('; '),g.toolsAndReports.join('; '),g.status,g.updatedBy,g.updatedAt]);
    const csv = [headers,...rows].map(row => row.map(value => `"${String(value ?? '').replaceAll('"','""')}"`).join(',')).join('\\r\\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'entitlement-groups.csv'; anchor.click();
    URL.revokeObjectURL(url);
  }
}
