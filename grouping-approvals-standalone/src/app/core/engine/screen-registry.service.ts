import { Injectable } from '@angular/core';
import { ScreenConfig } from '../config/screen-config.models';

@Injectable({ providedIn: 'root' })
export class ScreenRegistryService {
  // ScreenConfig is generic over row data. The registry stores configurations
  // for multiple row types, so use any at this heterogeneous registry boundary.
  private readonly screens = new Map<string, ScreenConfig<any>>();

  register(config: ScreenConfig<any>): void {
    const existing = this.screens.get(config.id);
    if (existing && existing !== config) {
      throw new Error(`Screen configuration "${config.id}" is already registered.`);
    }
    this.screens.set(config.id, config);
  }

  registerMany(configs: ScreenConfig<any>[]): void {
    for (const config of configs) this.register(config);
  }

  get<T = unknown>(id: string): ScreenConfig<T> {
    const config = this.screens.get(id);
    if (!config) throw new Error(`No screen configuration registered for "${id}".`);
    return config as ScreenConfig<T>;
  }

  has(id: string): boolean { return this.screens.has(id); }
  list(): ScreenConfig<any>[] { return [...this.screens.values()]; }
}
