import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import type { ColDef, GridOptions, ICellRendererParams } from 'ag-grid-community';
import { DynamicScreenComponent } from '../../shared/components/dynamic-screen/dynamic-screen.component';
import { DynamicFormComponent } from '../../shared/components/dynamic-form/dynamic-form.component';
import { FieldConfig, ScreenConfig } from '../../core/config/screen-config.models';
import { ScreenRegistryService } from '../../core/engine/screen-registry.service';
import { GROUPING_APPROVALS_SCREENS } from './grouping-approvals.screen-config';
import { ApprovalStatus, EntitlementGroup, GroupUpdate } from './grouping-approvals.models';
import { GROUPING_APPROVALS_REPOSITORY } from './grouping-approvals.repository';

type DialogMode = 'create' | 'edit';

@Component({
  selector: 'app-grouping-approvals',
  standalone: true,
  imports: [CommonModule, DynamicScreenComponent, DynamicFormComponent],
  templateUrl: './grouping-approvals.component.html',
  styleUrl: './grouping-approvals.component.scss'
})
export class GroupingApprovalsComponent implements OnInit {
  private readonly repository = inject(GROUPING_APPROVALS_REPOSITORY);
  private readonly screenRegistry = inject(ScreenRegistryService);
  readonly groupScreen: ScreenConfig<EntitlementGroup>;
  readonly groups = signal<EntitlementGroup[]>([]);
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
    { key: 'opsIds', label: 'Ops IDs', type: 'textarea', placeholder: 'R-10021, R-10022', visibleWhen: { field: 'opsScope', equals: 'Ops IDs' } },
    { key: 'allEntities', label: 'All Entities', type: 'checkbox', defaultValue: true },
    { key: 'status', label: 'Status', type: 'select', defaultValue: 'Pending', options: [{ label: 'Pending approval', value: 'Pending' }, { label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }, { label: 'Rejected', value: 'Rejected' }] },
    { key: 'userIds', label: 'Assigned User IDs', type: 'textarea', placeholder: 'One user ID per line or comma separated' },
    { key: 'roles', label: 'Assigned Roles', type: 'textarea', placeholder: 'ReghubOps1, ReghubOps2, Reviewer' },
    { key: 'toolsAndReports', label: 'Tools and Reports', type: 'textarea', placeholder: 'ReghubOps Summary, Break Report' }
  ];

  readonly filteredGroups = computed(() => {
    const query = this.searchText().trim().toLowerCase();
    const rows = this.groups();
    return query
      ? rows.filter(group => [group.groupName, group.description, group.owner, ...group.userIds, ...group.roles, ...group.opsIds].join(' ').toLowerCase().includes(query))
      : rows;
  });

  readonly groupColumnDefs: ColDef<EntitlementGroup>[] = [
    ...GROUPING_APPROVALS_SCREENS[0].grid!.columns as ColDef<EntitlementGroup>[],
    {
      headerName: 'Actions', colId: 'rowActions', pinned: 'right', sortable: false, filter: false,
      resizable: false, minWidth: 150, flex: 0,
      cellRenderer: (params: ICellRendererParams<EntitlementGroup>) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'ga-grid-actions';
        for (const action of [
          { label: 'Edit', run: () => params.data && this.openEditGroup(params.data) },
          { label: 'Delete', run: () => params.data && void this.deleteGroup(params.data) }
        ]) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'ga-grid-action';
          button.textContent = action.label;
          button.addEventListener('click', action.run);
          wrapper.append(button);
        }
        return wrapper;
      }
    }
  ];

  readonly gridOptions: GridOptions<EntitlementGroup> = {
    animateRows: true,
    pagination: true,
    paginationPageSize: 20,
    paginationPageSizeSelector: [10, 20, 50, 100],
    rowSelection: { mode: 'multiRow' },
    suppressCellFocus: false
  };

  constructor() {
    this.screenRegistry.registerMany(GROUPING_APPROVALS_SCREENS);
    this.groupScreen = this.screenRegistry.get<EntitlementGroup>('groups');
  }

  async ngOnInit(): Promise<void> { await this.loadGroups(); }

  async loadGroups(): Promise<void> {
    this.busy.set(true);
    this.errorMessage.set('');
    try {
      this.groups.set(await this.repository.getGroups());
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load groups.');
    } finally {
      this.busy.set(false);
    }
  }

  openCreateGroup(): void {
    this.selectedGroup.set(null);
    this.initialFormValue.set(this.formValue());
    this.dialogMode.set('create');
    this.errorMessage.set('');
  }

  openEditGroup(group: EntitlementGroup): void {
    this.selectedGroup.set(group);
    this.initialFormValue.set(this.formValue(group));
    this.dialogMode.set('edit');
    this.errorMessage.set('');
  }

  closeDialog(): void {
    this.dialogMode.set(null);
    this.selectedGroup.set(null);
  }

  private parseList(value: unknown): string[] {
    return String(value ?? '').split(/[\n,;]/).map(item => item.trim()).filter(Boolean);
  }

  private formValue(group?: EntitlementGroup): Record<string, unknown> {
    return {
      groupName: group?.groupName ?? '',
      owner: group?.owner ?? '',
      description: group?.description ?? '',
      approvers: group?.approvers.join(', ') ?? '',
      opsScope: group?.opsScope ?? 'All Ops',
      opsIds: group?.opsIds?.join(', ') ?? '',
      allEntities: group ? group.allEntities === 1 : true,
      status: group?.status ?? 'Pending',
      userIds: group?.userIds.join('\n') ?? '',
      roles: group?.roles.join('\n') ?? '',
      toolsAndReports: group?.toolsAndReports.join('\n') ?? ''
    };
  }

  async saveGroupForm(value: Record<string, unknown>): Promise<void> {
    const groupName = String(value['groupName'] ?? '').trim();
    const owner = String(value['owner'] ?? '').trim();
    if (!groupName || !owner) {
      this.errorMessage.set('Group name and owner are required.');
      return;
    }

    const status: ApprovalStatus = value['status'] === 'Active' ? 'Active'
      : value['status'] === 'Inactive' ? 'Inactive'
      : value['status'] === 'Rejected' ? 'Rejected' : 'Pending';
    const data = {
      groupName,
      description: String(value['description'] ?? '').trim(),
      owner,
      approvers: this.parseList(value['approvers']),
      opsScope: value['opsScope'] === 'Ops IDs' ? 'Ops IDs' as const : 'All Ops' as const,
      opsIds: this.parseList(value['opsIds']),
      allEntities: value['allEntities'] ? 1 : 0,
      status,
      userIds: this.parseList(value['userIds']),
      roles: this.parseList(value['roles']),
      toolsAndReports: this.parseList(value['toolsAndReports'])
    };

    this.busy.set(true);
    this.errorMessage.set('');
    try {
      const selected = this.selectedGroup();
      if (!selected) {
        const created = await this.repository.createGroup(data);
        this.groups.update(rows => [created, ...rows]);
      } else {
        const update: GroupUpdate = {
          description: data.description, owner: data.owner, approvers: data.approvers,
          userIds: data.userIds, roles: data.roles, toolsAndReports: data.toolsAndReports,
          opsScope: data.opsScope, opsIds: data.opsIds, allEntities: data.allEntities, status: data.status
        };
        const saved = await this.repository.saveGroup(selected.id, update);
        this.groups.update(rows => rows.map(row => row.id === saved.id ? saved : row));
      }
      this.closeDialog();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to save group.');
    } finally {
      this.busy.set(false);
    }
  }

  async deleteGroup(group: EntitlementGroup): Promise<void> {
    if (!window.confirm(`Delete entitlement group "${group.groupName}"? This cannot be undone.`)) return;
    this.busy.set(true);
    this.errorMessage.set('');
    try {
      await this.repository.deleteGroup(group.id);
      this.groups.update(rows => rows.filter(row => row.id !== group.id));
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to delete group.');
    } finally {
      this.busy.set(false);
    }
  }

  exportGroups(): void {
    const headers = ['Group Name', 'Description', 'Owner', 'Approvers', 'Ops Scope', 'Ops IDs', 'Users', 'Roles', 'Tools and Reports', 'Status', 'Updated By', 'Updated Date'];
    const rows = this.filteredGroups().map(group => [
      group.groupName, group.description, group.owner, group.approvers.join('; '), group.opsScope,
      group.opsIds.join('; '), group.userIds.join('; '), group.roles.join('; '),
      group.toolsAndReports.join('; '), group.status, group.updatedBy, group.updatedAt
    ]);
    const csv = [headers, ...rows].map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'entitlement-groups.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
