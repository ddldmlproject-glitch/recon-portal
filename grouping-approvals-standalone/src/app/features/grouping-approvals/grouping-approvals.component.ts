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
import { EntitlementGroup, ReconLoadTrigger, GroupUpdate, ApprovalStatus } from './grouping-approvals.models';
import { GROUPING_APPROVALS_REPOSITORY } from './grouping-approvals.repository';
import { UserScreenStorageService, UserCreatedScreen } from '../../core/engine/user-screen-storage.service';

type DialogMode = 'create' | 'edit';
type ScreenFieldDraft = { label: string; type: FieldConfig['type']; required: boolean; options: string };

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
  private readonly userScreenStorage = inject(UserScreenStorageService);
  readonly groupScreen: ScreenConfig<EntitlementGroup>;
  readonly triggerScreen: ScreenConfig<ReconLoadTrigger>;

  readonly activeTab = signal('grouping');
  readonly adminMenuOpen = signal(false);
  readonly groups = signal<EntitlementGroup[]>([]);
  readonly triggers = signal<ReconLoadTrigger[]>([]);
  readonly searchText = signal('');
  readonly selectedGroup = signal<EntitlementGroup | null>(null);
  readonly dialogMode = signal<DialogMode | null>(null);
  readonly busy = signal(false);
  readonly errorMessage = signal('');
  readonly initialFormValue = signal<Record<string, unknown>>({});
  readonly userScreens = signal<UserCreatedScreen[]>([]);
  readonly userScreenRecords = signal<Record<string, Record<string, unknown>[]>>({});
  readonly screenBuilderOpen = signal(false);
  readonly recordEditorOpen = signal(false);
  readonly newScreenName = signal('');
  readonly newScreenDescription = signal('');
  readonly screenFieldDrafts = signal<ScreenFieldDraft[]>([{ label: 'Name', type: 'text', required: true, options: '' }]);
  readonly customRecordValue = signal<Record<string, unknown>>({});
  readonly customRecordScreen = computed(() => this.userScreens().find(item => item.config.id === this.activeTab()) ?? null);
  readonly adminScreens = [{ id: 'grouping', label: 'Grouping' }, { id: 'inbox', label: 'Inbox' }, { id: 'orchestration', label: 'Orchestration' }, { id: 'create-screen', label: 'Create Screen' }];
  readonly visibleTabs = computed(() => [...this.adminScreens, ...this.userScreens().map(item => ({ id: item.config.id, label: item.config.title }))]);

  readonly groupFormFields: FieldConfig[] = [
    { key: 'groupName', label: 'Group Name', type: 'text', required: true, placeholder: 'Enter unique group name' },
    { key: 'owner', label: 'Group Owner', type: 'text', required: true, placeholder: 'Enter owner user ID' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the group purpose' },
    { key: 'approvers', label: 'Group Approvers', type: 'textarea', placeholder: 'Enter IDs separated by commas or new lines' },
    { key: 'reconSelection', label: 'Recon Selection', type: 'select', defaultValue: 'All Recons', options: [{ label: 'All Recons', value: 'All Recons' }, { label: 'Specific Recon IDs', value: 'Recon IDs' }] },
    { key: 'reconIds', label: 'Recon IDs', type: 'textarea', placeholder: 'R-10021, R-10022' , visibleWhen: { field: 'reconSelection', equals: 'Recon IDs' } },
    { key: 'allEntities', label: 'All Entities', type: 'checkbox', defaultValue: true },
    { key: 'status', label: 'Status', type: 'select', defaultValue: 'Pending', options: [{ label: 'Pending approval', value: 'Pending' }, { label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }, { label: 'Rejected', value: 'Rejected' }] },
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
  readonly triggerColumnDefs: ColDef<ReconLoadTrigger>[] = this.screens[1].grid!.columns as ColDef<ReconLoadTrigger>[];
  readonly gridOptions: GridOptions = {
    animateRows: true, pagination: true, paginationPageSize: 20,
    paginationPageSizeSelector: [10, 20, 50, 100],
    rowSelection: { mode: 'multiRow' }, suppressCellFocus: false
  };

  constructor() {
    this.screenRegistry.registerMany(this.screens);
    const savedScreens = this.userScreenStorage.loadScreens();
    for (const item of savedScreens) { try { this.screenRegistry.register(item.config); } catch { /* Existing screen IDs are ignored safely. */ } }
    this.userScreens.set(savedScreens);
    this.userScreenRecords.set(this.userScreenStorage.loadRecords());
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

  setTab(id: string): void { this.activeTab.set(id); this.searchText.set(''); this.adminMenuOpen.set(false); this.screenBuilderOpen.set(false); }
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
      approvers: group?.approvers.join(', ') ?? '', reconSelection: group?.reconSelection ?? 'All Recons',
      reconIds: group?.reconIds?.join(', ') ?? '', allEntities: group ? group.allEntities === 1 : true,
      status: group?.status ?? 'Pending', userIds: group?.userIds.join('\n') ?? '',
      roles: group?.roles.join('\n') ?? '', toolsAndReports: group?.toolsAndReports.join('\n') ?? ''
    };
  }

  async saveGroupForm(value: Record<string, unknown>): Promise<void> {
    const groupName = String(value['groupName'] ?? '').trim();
    const owner = String(value['owner'] ?? '').trim();
    if (!groupName || !owner) { this.errorMessage.set('Group name and owner are required.'); return; }
    const selected = this.selectedGroup();
    const status: ApprovalStatus = value['status'] === 'Active' ? 'Active' : value['status'] === 'Inactive' ? 'Inactive' : value['status'] === 'Rejected' ? 'Rejected' : 'Pending';
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

  openScreenBuilder(): void {
    this.setTab('create-screen');
    this.newScreenName.set(''); this.newScreenDescription.set('');
    this.screenFieldDrafts.set([{ label: 'Name', type: 'text', required: true, options: '' }]);
    this.errorMessage.set('');
    this.screenBuilderOpen.set(false);
  }
  closeScreenBuilder(): void { this.setTab('grouping'); }
  addScreenField(): void {
    this.screenFieldDrafts.update(fields => [...fields, { label: '', type: 'text', required: true, options: '' }]);
  }
  setScreenFieldType(index: number, type: string): void {
    const allowed: FieldConfig['type'][] = ['text', 'textarea', 'number', 'date', 'select', 'checkbox'];
    if (allowed.includes(type as FieldConfig['type'])) {
      this.updateScreenField(index, { type: type as FieldConfig['type'], options: type === 'select' ? '' : '' });
    }
  }
  removeScreenField(index: number): void {
    this.screenFieldDrafts.update(fields => fields.filter((_field, fieldIndex) => fieldIndex !== index));
  }
  updateScreenField(index: number, patch: Partial<ScreenFieldDraft>): void {
    this.screenFieldDrafts.update(fields => fields.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...patch } : field));
  }
  createUserScreen(): void {
    const title = this.newScreenName().trim();
    if (!title) { this.errorMessage.set('Enter a screen name.'); return; }
    const fields: FieldConfig[] = [];
    const drafts = this.screenFieldDrafts();
    if (!drafts.length) { this.errorMessage.set('Add at least one field.'); return; }
    for (const [index, draft] of drafts.entries()) {
      const label = draft.label.trim();
      if (!label) { this.errorMessage.set(`Enter a label for field ${index + 1}.`); return; }
      const key = label.replace(/[^a-zA-Z0-9]+(.)/g, (_match, char: string) => char.toUpperCase()).replace(/[^a-zA-Z0-9]/g, '');
      if (!key || fields.some(field => field.key.toLowerCase() === key.toLowerCase())) {
        this.errorMessage.set(`Field name "${label}" is empty or duplicated.`); return;
      }
      const options = draft.options.split(',').map(option => option.trim()).filter(Boolean);
      if (draft.type === 'select' && !options.length) {
        this.errorMessage.set(`Add at least one option for "${label}".`); return;
      }
      fields.push({
        key, label, type: draft.type, required: draft.required,
        placeholder: `Enter ${label.toLowerCase()}`,
        ...(draft.type === 'select' ? { options: options.map(value => ({ label: value, value })) } : {})
      });
    }
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!id || this.screenRegistry.has(id) || this.userScreens().some(item => item.config.id === id)) {
      this.errorMessage.set('A screen with this name already exists. Choose a different name.'); return;
    }
    const config = this.userScreenStorage.createConfig(id, title, this.newScreenDescription().trim(), fields);
    const next = [...this.userScreens(), { config, records: [] }];
    this.screenRegistry.register(config);
    this.userScreens.set(next);
    this.userScreenRecords.update(records => ({ ...records, [id]: [] }));
    this.userScreenStorage.saveScreens(next);
    this.userScreenStorage.saveRecords(this.userScreenRecords());
    this.activeTab.set(id); this.searchText.set(''); this.screenBuilderOpen.set(false); this.errorMessage.set('');
  }
  openCustomRecordEditor(): void {
    const screen = this.customRecordScreen();
    if (!screen) return;
    this.customRecordValue.set(Object.fromEntries((screen.config.fields ?? []).map(field => [field.key, field.defaultValue ?? (field.type === 'checkbox' ? false : '')])));
    this.recordEditorOpen.set(true);
  }
  closeCustomRecordEditor(): void { this.recordEditorOpen.set(false); }
  saveCustomRecord(value: Record<string, unknown>): void {
    const screen = this.customRecordScreen();
    if (!screen) return;
    const record = { id: `${screen.config.id}-${Date.now()}`, ...value };
    this.userScreenRecords.update(records => ({ ...records, [screen.config.id]: [record, ...(records[screen.config.id] ?? [])] }));
    this.userScreenStorage.saveRecords(this.userScreenRecords());
    this.recordEditorOpen.set(false);
  }
  deleteUserScreen(): void {
    const screen = this.customRecordScreen();
    if (!screen || !window.confirm(`Delete screen "${screen.config.title}" and its locally saved records?`)) return;
    const next = this.userScreens().filter(item => item.config.id !== screen.config.id);
    this.userScreens.set(next); this.userScreenStorage.saveScreens(next);
    this.userScreenRecords.update(records => { const copy = { ...records }; delete copy[screen.config.id]; return copy; });
    this.userScreenStorage.saveRecords(this.userScreenRecords());
    this.activeTab.set('grouping');
  }

  exportGroups(): void {
    const headers = ['Group Name','Description','Owner','Approvers','Recon Selection','Recon IDs','Users','Roles','Tools and Reports','Status','Updated By','Updated Date'];
    const rows = this.filteredGroups().map(g => [g.groupName,g.description,g.owner,g.approvers.join('; '),g.reconSelection,g.reconIds.join('; '),g.userIds.join('; '),g.roles.join('; '),g.toolsAndReports.join('; '),g.status,g.updatedBy,g.updatedAt]);
    const csv = [headers,...rows].map(row => row.map(value => `"${String(value ?? '').replaceAll('"','""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'entitlement-groups.csv'; anchor.click();
    URL.revokeObjectURL(url);
  }
}
