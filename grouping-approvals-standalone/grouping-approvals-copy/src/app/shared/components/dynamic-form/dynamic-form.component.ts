import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FieldConfig } from '../../../core/config/screen-config.models';
import { FormEngineService } from '../../../core/engine/form-engine.service';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form class="dynamic-form" [formGroup]="form" (ngSubmit)="submit()">
      <div class="field-grid">
        @for (field of visibleFields(); track field.key) {
          <label class="field" [class.field--wide]="field.type === 'textarea'">
            <span>{{ field.label }} @if (field.required) { <b>*</b> }</span>
            @switch (field.type) {
              @case ('textarea') { <textarea [formControlName]="field.key" [placeholder]="field.placeholder ?? ''" rows="3"></textarea> }
              @case ('select') {
                <select [formControlName]="field.key">
                  <option [ngValue]="null">Select {{ field.label }}</option>
                  @for (option of field.options ?? []; track option.value) {
                    <option [ngValue]="option.value">{{ option.label }}</option>
                  }
                </select>
              }
              @case ('checkbox') { <input type="checkbox" [formControlName]="field.key"> }
              @case ('multi-select') {
                <select multiple [formControlName]="field.key">
                  @for (option of field.options ?? []; track option.value) {
                    <option [ngValue]="option.value">{{ option.label }}</option>
                  }
                </select>
              }
              @default {
                <input [type]="field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'"
                  [formControlName]="field.key" [placeholder]="field.placeholder ?? ''">
              }
            }
            @if (form.controls[field.key]?.touched && form.controls[field.key]?.invalid) {
              <small class="error">{{ field.label }} is invalid or required.</small>
            }
          </label>
        }
      </div>
      <div class="form-actions"><button type="submit" [disabled]="form.invalid">Save</button></div>
    </form>
  `,
  styles: [`
    :host{display:block}.field-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
    .field{display:flex;flex-direction:column;gap:6px;color:#435365;font-size:12px;font-weight:600}
    .field--wide{grid-column:1/-1}.field input:not([type=checkbox]),.field textarea,.field select{width:100%;min-height:36px;padding:8px 10px;border:1px solid #cbd3dc;border-radius:4px;background:#fff;color:#263544;font:12px Arial,sans-serif}
    .field textarea{resize:vertical}.field input[type=checkbox]{align-self:flex-start}.field b,.error{color:#b42318}.error{font-weight:400}
    .form-actions{display:flex;justify-content:flex-end;margin-top:18px}.form-actions button{min-height:35px;padding:0 18px;border:0;border-radius:5px;background:#056dae;color:#fff;font-weight:700;cursor:pointer}.form-actions button:disabled{opacity:.5}
    @media(max-width:600px){.field-grid{grid-template-columns:1fr}.field--wide{grid-column:auto}}
  `]
})
export class DynamicFormComponent {
  readonly fields = input.required<FieldConfig[]>();
  readonly initialValue = input<Record<string, unknown>>({});
  readonly submitted = output<Record<string, unknown>>();
  readonly form: FormGroup = new FormGroup({});
  private readonly formRevision = signal(0);
  private readonly engine = new FormEngineService();

  readonly visibleFields = computed(() => this.fields().filter(field => {
    this.formRevision();
    if (!field.visibleWhen) return true;
    return this.form.get(field.visibleWhen.field)?.value === field.visibleWhen.equals;
  }));

  constructor() {
    effect(onCleanup => {
      const fields = this.fields();
      const initial = this.initialValue();
      const built = this.engine.build(fields, initial);
      this.form.setControl('metadata-placeholder', built);
      // Keep the public form controls at the root for straightforward formControlName binding.
      for (const key of Object.keys(this.form.controls)) this.form.removeControl(key);
      for (const [key, control] of Object.entries(built.controls)) this.form.addControl(key, control);
      const subscription = this.form.valueChanges.subscribe(() => this.formRevision.update(value => value + 1));
      onCleanup(() => subscription.unsubscribe());
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.valid) this.submitted.emit(this.form.getRawValue());
  }
}
