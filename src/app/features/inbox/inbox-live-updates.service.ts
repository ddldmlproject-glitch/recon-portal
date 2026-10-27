import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * Server-Sent Events (SSE) channel for live inbox/report updates.
 *
 * Backend contract expected:
 *   GET /api/reports/events
 *   Content-Type: text/event-stream
 *   event: report-created | report-updated | reports-refresh
 *   data: JSON payload
 *
 * Configure the endpoint to match the backend route when it is finalized.
 * Native EventSource automatically retries after a dropped connection.
 */
export type LiveReportEventType = 'report-created' | 'report-updated' | 'reports-refresh' | 'notification';

export interface LiveReportEvent {
  type: LiveReportEventType;
  report?: Record<string, unknown>;
  reportId?: string;
  message?: string;
  timestamp?: string;
}

@Injectable({ providedIn: 'root' })
export class InboxLiveUpdatesService implements OnDestroy {
  private readonly eventsSubject = new Subject<LiveReportEvent>();
  readonly events$: Observable<LiveReportEvent> = this.eventsSubject.asObservable();

  private source: EventSource | null = null;
  private endpoint = '';

  /**
   * Connect to the backend SSE endpoint. Calling connect again replaces the
   * previous connection. Keep endpoint empty until the API route is available.
   */
  connect(endpoint: string): void {
    const nextEndpoint = endpoint.trim();
    if (!nextEndpoint || typeof EventSource === 'undefined') return;
    if (this.source && this.endpoint === nextEndpoint) return;

    this.disconnect();
    this.endpoint = nextEndpoint;
    this.source = new EventSource(nextEndpoint, { withCredentials: true });

    this.source.onmessage = event => this.emit('reports-refresh', event.data);

    const eventNames: LiveReportEventType[] = [
      'report-created',
      'report-updated',
      'reports-refresh',
      'notification'
    ];
    for (const eventName of eventNames) {
      this.source.addEventListener(eventName, (event: MessageEvent) => {
        this.emit(eventName, event.data);
      });
    }
  }

  disconnect(): void {
    this.source?.close();
    this.source = null;
    this.endpoint = '';
  }

  private emit(type: LiveReportEventType, rawData: string): void {
    try {
      const payload = JSON.parse(rawData) as Record<string, unknown>;
      this.eventsSubject.next({
        type,
        report: (payload['report'] && typeof payload['report'] === 'object')
          ? payload['report'] as Record<string, unknown>
          : payload,
        reportId: String(payload['reportId'] ?? payload['id'] ?? ''),
        message: typeof payload['message'] === 'string' ? payload['message'] : undefined,
        timestamp: typeof payload['timestamp'] === 'string' ? payload['timestamp'] : undefined
      });
    } catch {
      // Ignore malformed event payloads so one bad message cannot break the stream.
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.eventsSubject.complete();
  }
}
