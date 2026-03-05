// src/features/dashboard/api/dashboard.api.ts
import { api } from '@/lib/axios';

export const dashboardApi = {
  getStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  }
};