import { Component, input, output } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridOptions } from 'ag-grid-community';
import { themeQuartz } from 'ag-grid-community';

@Component({
  selector: 'app-dynamic-grid',
  standalone: true,
  imports: [AgGridAngular],
  template: `<ag-grid-angular class="dynamic-grid" [rowData]="rowData()" [columnDefs]="columnDefs()" [defaultColDef]="defaultColDef" [gridOptions]="gridOptions()" [theme]="theme" />`,
  styles: [`:host{display:block;width:100%;height:100%;min-width:0;min-height:450px}.dynamic-grid{display:block;width:100%;height:100%;min-height:450px}`]
})
export class DynamicGridComponent<TData = unknown> {
  readonly rowData = input<TData[]>([]);
  readonly columnDefs = input<ColDef<TData>[]>([]);
  readonly gridOptions = input<GridOptions<TData>>({});
  readonly rowAction = output<{ action: string; data: TData }>();
  readonly theme = themeQuartz.withParams({ spacing: 6, fontSize: 12, borderRadius: 4, headerFontSize: 12 });
  readonly defaultColDef: ColDef<TData> = {
    sortable: true, filter: true, resizable: true, minWidth: 110, flex: 1,
    wrapHeaderText: true, autoHeaderHeight: true
  };
}
