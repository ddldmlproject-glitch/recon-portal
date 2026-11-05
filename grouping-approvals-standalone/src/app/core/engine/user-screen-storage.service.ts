import { Injectable } from '@angular/core';
import { FieldConfig, ScreenConfig } from '../config/screen-config.models';

export interface UserCreatedScreen {
  config: ScreenConfig<Record<string, unknown>>;
  records: Record<string, unknown>[];
}

@Injectable({ providedIn: 'root' })
export class UserScreenStorageService {
  private readonly screensKey = 'recon-portal.user-screens.v1';
  private readonly recordsKey = 'recon-portal.user-screen-records.v1';

  loadScreens(): UserCreatedScreen[] {
    try { return JSON.parse(localStorage.getItem(this.screensKey) ?? '[]') as UserCreatedScreen[]; }
    catch { return []; }
  }
  saveScreens(screens: UserCreatedScreen[]): void {
    localStorage.setItem(this.screensKey, JSON.stringify(screens));
  }
  loadRecords(): Record<string, Record<string, unknown>[]> {
    try { return JSON.parse(localStorage.getItem(this.recordsKey) ?? '{}') as Record<string, Record<string, unknown>[]>; }
    catch { return {}; }
  }
  saveRecords(records: Record<string, Record<string, unknown>[]>): void {
    localStorage.setItem(this.recordsKey, JSON.stringify(records));
  }
  createConfig(id: string, title: string, description: string, fields: FieldConfig[]): ScreenConfig<Record<string, unknown>> {
    return {
      id, title, description, layout: 'grid', fields,
      dataSource: { resource: id, operation: 'localStorage' },
      grid: {
        id: id + '-grid', rowId: 'id',
        columns: fields.map(field => ({
          field: field.key,
          headerName: field.label,
          minWidth: 140,
          flex: 1
        })),
        pageSize: 20, selectable: true, quickFilter: true
      },
      actions: [{ id: 'add-record', label: 'Add Record', kind: 'create' }]
    };
  }
}
