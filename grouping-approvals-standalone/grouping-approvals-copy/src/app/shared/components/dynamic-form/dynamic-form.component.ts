import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FieldConfig } from '../../../core/config/screen-config.models';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form class="dynamic-form" (ngSubmit)="submit()">
      @for (field of fields(); track field.key) {
        @if (isVisible(field)) {
          <label class="form-field">
            <span>{{ field.label }}<b *ngIf="field.required"> *</b></span>
            @switch (field.type) {
              @case ('textarea') { <textarea [name]="field.key" [required]="!!field.required" [readonly]="!!field.readonly" [ngModel]="value()[field.key]" (ngModelChange)="setValue(field.key, $event)" [placeholder]="field.placeholder || ''"></textarea> }
              @case ('select') { <select [name]="field.key" [required]="!!field.required" [disabled]="!!field.readonly" [ngModel]="value()[field.key]" (ngModelChange)="setValue(field.key, $event)"><option value="">Select...</option>@for (option of field.options ?? []; track option.value) { <option [ngValue]="option.value">{{ option.label }}</option> }</select> }
              @case ('checkbox') { <input type="checkbox" [name]="field.key" [disabled]="!!field.readonly" [ngModel]="!!value()[field.key]" (ngModelChange)="setValue(field.key, $event)"> }
              @case ('number') { <input type="number" [name]="field.key" [required]="!!field.required" [readonly]="!!field.readonly" [ngModel]="value()[field.key]" (ngModelChange)="setValue(field.key, $event)" [placeholder]="field.placeholder || ''"> }
              @case ('date') { <input type="date" [name]="field.key" [required]="!!field.required" [readonly]="!!field.readonly" [ngModel]="value()[field.key]" (ngModelChange)="setValue(field.key, $event)"> }
              @default { <input type="text" [name]="field.key" [required]="!!field.required" [readonly]="!!field.readonly" [ngModel]="value()[field.key]" (ngModelChange)="setValue(field.key, $event)" [placeholder]="field.placeholder || ''"> }
            }
          </label>
        }
      }
      <div class="form-actions"><button type="submit">Save Group</button></div>
    </form>
  `,
  styles: [`
    .dynamic-form{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .form-field{display:grid;gap:6px;color:#506476;font-size:11px;font-weight:650}
    .form-field input:not([type=checkbox]),.form-field textarea,.form-field select{width:100%;min-height:36px;padding:8px 10px;border:1px solid #d5dfe7;border-radius:6px;background:#fff;color:#263746;font:inherit;font-weight:400;box-sizing:border-box}
    .form-field textarea{min-height:72px;resize:vertical}.form-field b{color:#bd4b40}
    .form-actions{grid-column:1/-1;display:flex;justify-content:flex-end;margin-top:6px}
    .form-actions button{min-height:35px;padding:0 16px;border:0;border-radius:6px;background:#0875b9;color:#fff;font-size:11px;font-weight:700;cursor:pointer}
    @media(max-width:620px){.dynamic-form{grid-template-columns:1fr}}
  `]
})
export class DynamicFormComponent {
  readonly fields = input<FieldConfig[]>([]);
  readonly initialValue = input<Record<string, unknown>>({});
  readonly submitted = output<Record<string, unknown>>();
  readonly value = signal<Record<string, unknown>>({});

  ngOnChanges(): void { this.value.set({ ...this.initialValue() }); }
  setValue(key: string, value: unknown): void { this.value.update(current => ({ ...current, [key]: value })); }
  isVisible(field: FieldConfig): boolean {
    return !field.visibleWhen || this.value()[field.visibleWhen.field] === field.visibleWhen.equals;
  }
  submit(): void { this.submitted.emit(this.value()); }
}
