export interface ApiOperationConfig {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description?: string;
}
export interface ApiEnvironmentConfig {
  baseUrl: string;
  operations: Record<string, ApiOperationConfig>;
}
