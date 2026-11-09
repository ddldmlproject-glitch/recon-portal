import { Component, input } from '@angular/core';
import type { ColDef, GridOptions } from 'ag-grid-community';
import { ScreenConfig } from '../../../core/config/screen-config.models';
import { DynamicGridComponent } from '../dynamic-grid/dynamic-grid.component';

@Component({
  selector: 'app-dynamic-screen',
  standalone: true,
  imports: [DynamicGridComponent],
  template: `
    @switch (config().layout) {
      @case ('grid') {
        @if (config().grid; as gridConfig) {
          <app-dynamic-grid [config]="gridConfig" [columnDefs]="columnDefs()" [rowData]="rowData()" [gridOptions]="gridOptions()" />
        } @else { <div class="screen-message">Grid layout requires a grid configuration.</div> }
      }
      @case ('form') { <div class="screen-message">Use DynamicFormComponent to render form controls.</div> }
      @case ('master-detail') { <div class="screen-message">Master-detail layout requires a renderer configuration.</div> }
    }
  `,
  styles: [`:host{display:block;width:100%;height:100%;min-width:0}.screen-message{padding:16px;color:#687888;font-size:12px}`]
})
export class DynamicScreenComponent<TData = unknown> {
  readonly config = input.required<ScreenConfig<TData>>();
  readonly rowData = input<TData[]>([]);
  readonly columnDefs = input<ColDef<TData>[]>([]);
  readonly gridOptions = input<GridOptions<TData>>({});
}
