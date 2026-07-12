import api from './api';

export const getMaintenance = (params = {}) => api.get('/maintenance', { params });
export const getMaintenanceById = (id) => api.get(`/maintenance/${id}`);
export const createMaintenance = (data) => api.post('/maintenance', data);
export const completeMaintenance = (id, data) => api.patch(`/maintenance/${id}/complete`, data);
export const cancelMaintenance = (id) => api.patch(`/maintenance/${id}/cancel`);
