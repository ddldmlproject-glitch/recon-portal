import { Injectable, inject } from '@angular/core';
import { ActionConfig } from '../config/screen-config.models';

export type ActionHandler = (context: { record?: unknown; payload?: unknown }) => void | Promise<void>;

@Injectable({ providedIn: 'root' })
export class ActionEngineService {
  private readonly handlers = new Map<string, ActionHandler>();

  register(handlerId: string, handler: ActionHandler): void {
    if (this.handlers.has(handlerId)) throw new Error(`Action handler "${handlerId}" is already registered.`);
    this.handlers.set(handlerId, handler);
  }

  async execute(action: ActionConfig, context: { record?: unknown; payload?: unknown } = {}): Promise<void> {
    if (!action.handler) throw new Error(`Action "${action.id}" has no registered handler.`);
    const handler = this.handlers.get(action.handler);
    if (!handler) throw new Error(`No handler registered for action "${action.handler}".`);
    await handler(context);
  }
}
