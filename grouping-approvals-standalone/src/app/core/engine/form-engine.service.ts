import { Injectable, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FieldConfig } from '../config/screen-config.models';

@Injectable({ providedIn: 'root' })
export class FormEngineService {
  readonly fields = signal<FieldConfig[]>([]);

  build(fields: FieldConfig[], initial: Record<string, unknown> = {}): FormGroup {
    this.fields.set(fields);
    const controls: Record<string, FormControl> = {};
    for (const field of fields) {
      const rules = (field.validators ?? []).map(rule => {
        switch (rule.type) {
          case 'required': return Validators.required;
          case 'minLength': return Validators.minLength(Number(rule.value));
          case 'maxLength': return Validators.maxLength(Number(rule.value));
          case 'email': return Validators.email;
          case 'pattern': return Validators.pattern(String(rule.value));
        }
      });
      if (field.required && !rules.includes(Validators.required)) rules.push(Validators.required);
      controls[field.key] = new FormControl(
        { value: initial[field.key] ?? field.defaultValue ?? null, disabled: !!field.readonly },
        { validators: rules }
      );
    }
    return new FormGroup(controls);
  }
}
