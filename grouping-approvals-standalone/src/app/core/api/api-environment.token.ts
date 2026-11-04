import { InjectionToken } from '@angular/core';
import { ApiEnvironmentConfig } from './api-operation.models';

export const API_ENVIRONMENT = new InjectionToken<ApiEnvironmentConfig>('API_ENVIRONMENT');
