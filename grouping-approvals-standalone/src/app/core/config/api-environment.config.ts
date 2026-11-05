import { ApiEnvironmentConfig } from '../api/api-operation.models';

export const API_ENVIRONMENT_CONFIG: ApiEnvironmentConfig = {
  baseUrl: '/api',
  operations: {
    groupsList: { id: 'groupsList', method: 'GET', path: '/groups' },
    groupsCreate: { id: 'groupsCreate', method: 'POST', path: '/groups' },
    groupsUpdate: { id: 'groupsUpdate', method: 'PUT', path: '/groups/:id' },
    groupsDelete: { id: 'groupsDelete', method: 'DELETE', path: '/groups/:id' },
    groupsDecision: { id: 'groupsDecision', method: 'POST', path: '/groups/:id/decision' },
    triggersList: { id: 'triggersList', method: 'GET', path: '/recon-load-triggers' }
  }
};
