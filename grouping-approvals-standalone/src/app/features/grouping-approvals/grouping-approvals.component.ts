import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import type { ColDef, GridOptions, ICellRendererParams } from 'ag-grid-community';
import { DynamicScreenComponent } from '../../shared/components/dynamic-screen/dynamic-screen.component';
import { DynamicFormComponent } from '../../shared/components/dynamic-form/dynamic-form.component';
import { ScreenConfig, FieldConfig } from '../../core/config/screen-config.models';
import { ScreenRegistryService } from '../../core/engine/screen-registry.service';
import { GROUPING_APPROVALS_CONFIG } from './grouping-approvals.config';
import { GROUPING_APPROVALS_SCREENS } from './grouping-approvals.screen-config';
import { EntitlementGroup, OpsLoadTrigger, GroupUpdate, ApprovalStatus } from './grouping-approvals.models';
import { GROUPING_APPROVALS_REPOSITORY } from './grouping-approvals.repository';
import { InboxComponent } from '../inbox/inbox.component';

type DialogMode = 'create' | 'edit';

@Component({
  selector: 'app-grouping-approvals',
  standalone: true,
  imports: [CommonModule, DynamicScreenComponent, DynamicFormComponent, InboxComponent],
  templateUrl: './grouping-approvals.component.html',
  styleUrl: './grouping-approvals.component.scss'
})
export class GroupingApprovalsComponent implements OnInit {
  readonly config = GROUPING_APPROVALS_CONFIG;
  readonly screens = GROUPING_APPROVALS_SCREENS;
  private readonly repository = inject(GROUPING_APPROVALS_REPOSITORY);
  private readonly screenRegistry = inject(ScreenRegistryService);
  readonly groupScreen: ScreenConfig<EntitlementGroup>;
  readonly triggerScreen: ScreenConfig<OpsLoadTrigger>;

  readonly activeTab = signal('grouping');
  readonly adminMenuOpen = signal(false);
  readonly groups = signal<EntitlementGroup[]>([]);
  readonly signedInUserId = 'sso0204';
  readonly triggers = signal<OpsLoadTrigger[]>([]);
  readonly searchText = signal('');
  readonly selectedGroup = signal<EntitlementGroup | null>(null);
  readonly dialogMode = signal<DialogMode | null>(null);
  readonly busy = signal(false);
  readonly errorMessage = signal('');
  readonly initialFormValue = signal<Record<string, unknown>>({});

  readonly groupFormFields: FieldConfig[] = [
    { key: 'groupName', label: 'Group Name', type: 'text', required: true, placeholder: 'Enter unique group name' },
    { key: 'owner', label: 'Group Owner', type: 'text', required: true, placeholder: 'Enter owner user ID' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the group purpose' },
    { key: 'approvers', label: 'Group Approvers', type: 'textarea', placeholder: 'Enter IDs separated by commas or new lines' },
    { key: 'opsScope', label: 'Ops Scope', type: 'select', defaultValue: 'All Ops', options: [{ label: 'All Ops', value: 'All Ops' }, { label: 'Specific Ops IDs', value: 'Ops IDs' }] },
    { key: 'opsIds', label: 'Ops IDs', type: 'textarea', placeholder: 'R-10021, R-10022' , visibleWhen: { field: 'opsScope', equals: 'Ops IDs' } },
    { key: 'allEntities', label: 'All Entities', type: 'checkbox', defaultValue: true },
    { key: 'userIds', label: 'Assigned User IDs', type: 'textarea', placeholder: 'One user ID per line or comma separated' },
    { key: 'roles', label: 'Assigned Roles', type: 'textarea', placeholder: 'ReghubOps1, ReghubOps2, Reviewer' },
    { key: 'toolsAndReports', label: 'Tools and Reports', type: 'textarea', placeholder: 'ReghubOps Summary, Break Report' }
  ];

  readonly activeGroupFormFields = computed(() => this.dialogMode() === 'edit'
    ? this.groupFormFields.filter(field => !['opsScope', 'opsIds', 'roles', 'toolsAndReports'].includes(field.key))
    : this.groupFormFields);

  readonly filteredGroups = computed(() => {
    const q = this.searchText().trim().toLowerCase();
    const rows = this.groups();
    return q ? rows.filter(g => [g.groupName, g.description, g.owner, ...g.userIds, ...g.roles, ...g.opsIds].join(' ').toLowerCase().includes(q)) : rows;
  });
  readonly filteredTriggers = computed(() => {
    const q = this.searchText().trim().toLowerCase();
    return q ? this.triggers().filter(t => Object.values(t).join(' ').toLowerCase().includes(q)) : this.triggers();
  });

  readonly groupColumnDefs: ColDef<EntitlementGroup>[] = [
    ...this.screens[0].grid!.columns as ColDef<EntitlementGroup>[],
    {
      headerName: 'Actions', colId: 'rowActions', pinned: 'right', sortable: false, filter: false,
      resizable: false, minWidth: 170, flex: 0,
      cellRenderer: (params: ICellRendererParams<EntitlementGroup>) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'ga-grid-actions';
        const actions: { label: string; run: () => void; disabled?: boolean }[] = [
          { label: 'Edit', run: () => params.data && this.openEditGroup(params.data) },
          { label: 'Delete', run: () => params.data && void this.deleteGroup(params.data) }
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
  readonly triggerColumnDefs: ColDef<OpsLoadTrigger>[] = this.screens[2].grid!.columns as ColDef<OpsLoadTrigger>[];
  readonly gridOptions: GridOptions = {
    animateRows: true, pagination: true, paginationPageSize: 20,
    paginationPageSizeSelector: [10, 20, 50, 100],
    rowSelection: { mode: 'multiRow' }, suppressCellFocus: false
  };

  constructor() {
    this.screenRegistry.registerMany(this.screens);
    this.groupScreen = this.screenRegistry.get<EntitlementGroup>('groups');
    this.triggerScreen = this.screenRegistry.get<OpsLoadTrigger>('triggers');
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

  setTab(id: string): void { this.activeTab.set(id); this.searchText.set(''); this.adminMenuOpen.set(false); }
  toggleAdminMenu(): void { this.adminMenuOpen.update(open => !open); }
  closeAdminMenu(): void { this.adminMenuOpen.set(false); }
  openCreateGroup(): void { this.selectedGroup.set(null); this.initialFormValue.set(this.formValue()); this.dialogMode.set('create'); this.errorMessage.set(''); }
  openEditGroup(group: EntitlementGroup): void { this.selectedGroup.set(group); this.initialFormValue.set(this.formValue(group)); this.dialogMode.set('edit'); this.errorMessage.set(''); }
  closeDialog(): void { this.dialogMode.set(null); this.selectedGroup.set(null); }

  private parseList(value: unknown): string[] {
    return String(value ?? '').split(/[\n,;]/).map(item => item.trim()).filter(Boolean);
  }

  private formValue(group?: EntitlementGroup): Record<string, unknown> {
    return {
      groupName: group?.groupName ?? '', owner: group?.owner ?? '', description: group?.description ?? '',
      approvers: group?.approvers.join(', ') ?? '', opsScope: group?.opsScope ?? 'All Ops',
      opsIds: group?.opsIds?.join(', ') ?? '', allEntities: group ? group.allEntities === 1 : true,
      status: group?.status ?? 'Pending', userIds: group?.userIds.join('\n') ?? '',
      roles: group?.roles.join('\n') ?? '', toolsAndReports: group?.toolsAndReports.join('\n') ?? ''
    };
  }

  async saveGroupForm(value: Record<string, unknown>): Promise<void> {
    const groupName = String(value['groupName'] ?? '').trim();
    const owner = String(value['owner'] ?? '').trim();
    if (!groupName || !owner) { this.errorMessage.set('Group name and owner are required.'); return; }
    const selected = this.selectedGroup();
    const status: ApprovalStatus = selected?.status ?? 'Pending';
    const data = {
      groupName, description: String(value['description'] ?? '').trim(), owner,
      approvers: this.parseList(value['approvers']),
      opsScope: value['opsScope'] === 'Ops IDs' ? 'Ops IDs' as const : 'All Ops' as const,
      opsIds: this.parseList(value['opsIds']), allEntities: value['allEntities'] ? 1 : 0,
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
          userIds: data.userIds, roles: selected.roles, toolsAndReports: selected.toolsAndReports,
          opsScope: selected.opsScope, opsIds: selected.opsIds,
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

  async handleInboxDecision(event: { groupId: string; decision: 'Approved' | 'Rejected'; comment: string }): Promise<void> {
    this.busy.set(true); this.errorMessage.set('');
    try {
      const updated = await this.repository.decideGroup(event.groupId, event.decision, event.comment);
      this.groups.update(rows => rows.map(row => row.id === updated.id ? updated : row));
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to update the group approval.');
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

  exportGroups(): void {
    const headers = ['Group Name','Description','Owner','Approvers','Ops Scope','Ops IDs','Users','Roles','Tools and Reports','Status','Updated By','Updated Date'];
    const rows = this.filteredGroups().map(g => [g.groupName,g.description,g.owner,g.approvers.join('; '),g.opsScope,g.opsIds.join('; '),g.userIds.join('; '),g.roles.join('; '),g.toolsAndReports.join('; '),g.status,g.updatedBy,g.updatedAt]);
    const csv = [headers,...rows].map(row => row.map(value => `"${String(value ?? '').replaceAll('"','""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'entitlement-groups.csv'; anchor.click();
    URL.revokeObjectURL(url);
  }
}
