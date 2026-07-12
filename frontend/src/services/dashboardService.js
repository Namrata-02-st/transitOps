import api from './api';

export const getDashboardKPIs = (params = {}) => api.get('/dashboard/kpis', { params });
export const getVehicleStatusChart = () => api.get('/dashboard/vehicle-status');
export const getExpenseSummary = () => api.get('/dashboard/expense-summary');
export const getRecentTrips = () => api.get('/dashboard/recent-trips');
