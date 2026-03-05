// src/features/dashboard/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { LayoutDashboard, Users, BookOpen, ShieldAlert, Activity, UserPlus } from 'lucide-react';
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import { toast } from 'sonner';

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardApi.getStats();
        setStats(data);
      } catch (error) {
        toast.error('Failed to load dashboard statistics');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const metrics = [
    { label: "Total Students", value: stats?.metrics?.totalStudents || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Test Series", value: stats?.metrics?.activeTests || 0, icon: LayoutDashboard, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Total Questions Bank", value: stats?.metrics?.totalQuestions || 0, icon: BookOpen, color: "text-green-600", bg: "bg-green-50" },
    { label: "System Admins", value: stats?.metrics?.totalAdmins || 0, icon: ShieldAlert, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, <span className="text-orange-600">{user?.name || 'Admin'}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <Activity size={14} className="text-green-500" /> System operating normally
          </p>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">
                  {isLoading ? '...' : stat.value.toLocaleString()}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Signups Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
          <UserPlus size={18} className="text-orange-500" />
          <h3 className="font-bold text-gray-800">Recent Student Signups</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-5 py-3">Email Address</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-400">Loading recent students...</td>
                </tr>
              ) : stats?.recentStudents?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-400">No recent signups found.</td>
                </tr>
              ) : (
                stats?.recentStudents?.map((student: any) => (
                  <tr key={student.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{student.full_name}</td>
                    <td className="px-5 py-3 text-gray-600">{student.email}</td>
                    <td className="px-5 py-3 text-gray-600">{student.phone_number || '-'}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(student.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};