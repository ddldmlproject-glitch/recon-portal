import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PermissionEngineService {
  private readonly granted = signal<ReadonlySet<string>>(new Set());
  readonly permissions = this.granted.asReadonly();

  setPermissions(permissions: string[]): void { this.granted.set(new Set(permissions)); }
  can(permission?: string): boolean { return !permission || this.granted().has(permission); }
  canAll(permissions: string[] = []): boolean { return permissions.every(permission => this.can(permission)); }
}
