import { Injectable } from '@angular/core';
import { ScreenConfig } from '../config/screen-config.models';

@Injectable({ providedIn: 'root' })
export class ScreenRegistryService {
  private readonly screens = new Map<string, ScreenConfig>();

  register(config: ScreenConfig): void {
    const existing = this.screens.get(config.id);
    if (existing && existing !== config) {
      throw new Error(`Screen configuration "${config.id}" is already registered.`);
    }
    this.screens.set(config.id, config);
  }

  registerMany(configs: ScreenConfig[]): void {
    for (const config of configs) this.register(config);
  }

  get<T = unknown>(id: string): ScreenConfig<T> {
    const config = this.screens.get(id);
    if (!config) throw new Error(`No screen configuration registered for "${id}".`);
    return config as ScreenConfig<T>;
  }

  has(id: string): boolean { return this.screens.has(id); }
  list(): ScreenConfig[] { return [...this.screens.values()]; }
}
