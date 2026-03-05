// src/components/layout/AdminLayout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Flame, LayoutDashboard, Users, BookOpen, 
  Settings, LogOut, Search, Bell, Menu, X, UploadCloud
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

export const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: BookOpen, label: 'Exams & Tests', path: '/exams' },
    { icon: UploadCloud, label: 'Question Upload', path: '/questions/bulk-upload' },
    { icon: Users, label: 'User Management', path: '/users' },
    { icon: Settings, label: 'System Config', path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-xl",
        !sidebarOpen && "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 bg-slate-950 font-bold text-white text-lg gap-2 border-b border-slate-800">
          <Flame className="text-orange-500 animate-pulse" size={24} />
          Agni Shiksha
          <button className="md:hidden ml-auto text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-2 mt-4">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-orange-600/15 text-orange-500 border border-orange-600/30 shadow-inner" 
                    : "hover:bg-slate-800 hover:text-white border border-transparent"
                )}
              >
                <Icon size={18} className={isActive ? "text-orange-500" : "text-slate-400"} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-gray-500 hover:text-orange-600 transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="relative hidden sm:block w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search users, tests, or exams..." 
                className="h-9 w-full rounded-md border border-gray-300 pl-10 pr-4 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-shadow"
              />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button className="text-gray-400 hover:text-orange-600 relative transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-orange-500 border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-semibold text-gray-700">{user?.name || 'Admin'}</span>
                <span className="text-xs text-orange-600 font-medium capitalize">{user?.role?.replace('_', ' ') || 'Super Admin'}</span>
              </div>
              <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold border border-orange-200 shadow-sm">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-600 ml-1 transition-colors" title="Logout">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Workspace (React Router Outlet) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-gray-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};