// src/features/users/api/user.api.ts
import { api } from '@/lib/axios';

export const userApi = {
  getStudents: async (params: { page: number; limit: number; search: string }) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  
  toggleBan: async (userId: string, ban_reason?: string) => {
    const response = await api.put(`/admin/users/${userId}/ban`, { ban_reason });
    return response.data;
  }
};