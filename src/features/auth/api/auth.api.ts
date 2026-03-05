// src/features/auth/api/auth.api.ts
import { api } from '@/lib/axios';
import type { User } from '@/store/useAuthStore';

interface AdminLoginResponse {
  message: string;
  token: string;
  admin: User;
}

/**
 * Authentication specific API routes for the Admin Portal.
 * Maps directly to `src/routes/adminAuth.routes.ts` on the backend.
 */
export const authApi = {
  // Step 1: Request OTP
  requestOtp: async (email: string) => {
    const response = await api.post('/admin/auth/request-otp', { email });
    return response.data;
  },
  
  // Step 2: Verify both Password and OTP simultaneously
  login: async (email: string, password: string, otp: string): Promise<AdminLoginResponse> => {
    const response = await api.post<AdminLoginResponse>('/admin/auth/login', { 
      email, 
      password, 
      otp 
    });
    return response.data;
  },
};