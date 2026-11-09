import type { ColDef } from 'ag-grid-community';

export type ScreenLayout = 'grid' | 'form' | 'master-detail';
export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'multi-select';
export interface OptionConfig { label: string; value: string | number | boolean; }
export interface ValidatorConfig { type: 'required' | 'minLength' | 'maxLength' | 'email' | 'pattern'; value?: number | string; message: string; }
export interface FieldConfig {
  key: string; label: string; type: FieldType; required?: boolean; readonly?: boolean;
  placeholder?: string; defaultValue?: unknown; options?: OptionConfig[]; validators?: ValidatorConfig[];
  visibleWhen?: { field: string; equals: unknown };
}
export interface ActionConfig {
  id: string; label: string; kind: 'create' | 'edit' | 'delete' | 'view' | 'export' | 'custom';
  permission?: string; confirmation?: string; handler?: string; icon?: string;
}
export interface TabConfig { id: string; label: string; screenId: string; }
export interface GridConfig<TData = unknown> {
  id: string; rowId: string; columns: ColDef<TData>[]; pageSize?: number;
  selectable?: boolean; quickFilter?: boolean; autoSize?: boolean;
}
export interface DataSourceConfig { resource: string; operation: string; }
export interface ScreenConfig<TData = unknown> {
  id: string; title: string; description?: string; layout: ScreenLayout;
  dataSource?: DataSourceConfig; grid?: GridConfig<TData>; fields?: FieldConfig[];
  actions?: ActionConfig[]; tabs?: TabConfig[];
}
