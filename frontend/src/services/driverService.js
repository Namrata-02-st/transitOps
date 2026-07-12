import api from './api';

export const getDrivers = (params = {}) => api.get('/drivers', { params });
export const getAvailableDrivers = () => api.get('/drivers/available');
export const getDriver = (id) => api.get(`/drivers/${id}`);
export const createDriver = (data) => api.post('/drivers', data);
export const updateDriver = (id, data) => api.put(`/drivers/${id}`, data);
export const deleteDriver = (id) => api.delete(`/drivers/${id}`);
export const suspendDriver = (id) => api.patch(`/drivers/${id}/suspend`);
