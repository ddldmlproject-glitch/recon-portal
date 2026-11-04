import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_ENVIRONMENT } from './api-environment.token';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(API_ENVIRONMENT);

  request<T>(operationId: string, options: { pathParams?: Record<string, string>; query?: Record<string, string | number | boolean>; body?: unknown } = {}): Promise<T> {
    const operation = this.environment.operations[operationId];
    if (!operation) throw new Error(`API operation "${operationId}" is not configured.`);
    const path = operation.path.replace(/:([A-Za-z0-9_]+)/g, (_match, key: string) => {
      const value = options.pathParams?.[key];
      if (value === undefined) throw new Error(`Missing API path parameter "${key}".`);
      return encodeURIComponent(value);
    });
    let params = new HttpParams();
    for (const [key, value] of Object.entries(options.query ?? {})) params = params.set(key, String(value));
    const url = `${this.environment.baseUrl.replace(/\/$/, '')}${path}`;
    const request = {
      GET: () => this.http.get<T>(url, { params }),
      POST: () => this.http.post<T>(url, options.body, { params }),
      PUT: () => this.http.put<T>(url, options.body, { params }),
      PATCH: () => this.http.patch<T>(url, options.body, { params }),
      DELETE: () => this.http.delete<T>(url, { params })
    }[operation.method];
    return firstValueFrom(request());
  }
}
