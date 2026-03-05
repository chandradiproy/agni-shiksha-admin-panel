// src/App.tsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import { useAuthStore } from '@/store/useAuthStore';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Core Content Modules
import { ExamManagementPage } from '@/features/content/pages/ExamManagementPage';
import { QuestionBulkUploadPage } from '@/features/content/pages/QuestionBulkUploadPage';
import { UserManagementPage } from './features/users/pages/UserManagementPage';
import { User } from 'lucide-react';
/**
 * Route Guard for Authenticated Only Paths
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

/**
 * Route Guard for Guest Only Paths (e.g., Login screen)
 */
const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default function App() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  // Listen for unauthorized 401 events globally triggered from Axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      navigate('/login');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout, navigate]);

  return (
    <>
      <Toaster position="bottom-right" richColors />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Public/Guest Routes */}
        <Route 
          path="/login" 
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          } 
        />

        {/* Protected Admin Routes */}
        <Route 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Content Management Engine Routes */}
          <Route path="/exams" element={<ExamManagementPage />} />
          <Route path="/questions/bulk-upload" element={<QuestionBulkUploadPage />} />
          
          {/* Temporary Stubs for future modules */}
          <Route path="/users" element={
            <UserManagementPage />
          } />
          
          {/* <Route path="/settings" element={
            <div className="p-12 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 animate-in fade-in">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">System Configuration</h2>
              <p className="text-sm">Global settings and API keys configuration panel.</p>
            </div>
          } /> */}
        </Route>
        
        {/* Fallback 404 Route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}