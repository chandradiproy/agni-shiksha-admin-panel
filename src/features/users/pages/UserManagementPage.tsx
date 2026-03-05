// src/features/users/pages/UserManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Users, Search, ShieldAlert, CheckCircle, Ban, X, AlertTriangle } from 'lucide-react';
import { userApi } from '@/features/users/api/user.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const UserManagementPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pagination & Search State
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Ban Modal State
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [banReason, setBanReason] = useState('');
  const [isBanning, setIsBanning] = useState(false);

  // Handle Debouncing for Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await userApi.getStudents({ page, limit, search: debouncedSearch });
      setUsers(res.data || []);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, debouncedSearch]);

  // Ban / Unban Logic
  const handleToggleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsBanning(true);
    try {
      await userApi.toggleBan(selectedUser.id, !selectedUser.is_banned ? banReason : undefined);
      toast.success(selectedUser.is_banned ? 'User successfully unbanned' : 'User successfully banned');
      setBanModalOpen(false);
      setBanReason('');
      fetchUsers(); // Refresh the list
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user status');
    } finally {
      setIsBanning(false);
    }
  };

  const openBanModal = (user: any) => {
    setSelectedUser(user);
    if (user.is_banned) {
      // If already banned, prompt for unban confirmation directly
      if (window.confirm(`Are you sure you want to unban ${user.full_name}?`)) {
        handleToggleBan({ preventDefault: () => {} } as any);
      }
    } else {
      // If active, open modal to ask for a reason
      setBanReason('');
      setBanModalOpen(true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-orange-500" /> Student Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage all {totalCount} registered students across the platform.</p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by name, email, or phone..." 
            className="pl-9 bg-white shadow-sm focus:ring-orange-500"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-4">Student Details</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">Target Exam</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Joined Date</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">Loading student records...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <ShieldAlert size={32} className="mb-2 opacity-30" />
                      No students found matching your criteria.
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className={`transition-colors ${user.is_banned ? 'bg-red-50/30' : 'hover:bg-gray-50'}`}>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-gray-800">{user.full_name}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5" title="User ID">ID: {user.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-gray-700">{user.email}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{user.phone_number || 'No Phone'}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {user.target_exam?.name || 'Not Selected'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {user.is_banned ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          <Ban size={12} /> Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          <CheckCircle size={12} /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button 
                        variant="outline" 
                        className={`h-8 px-3 text-xs border-gray-200 shadow-sm ${
                          user.is_banned 
                            ? 'text-green-600 hover:bg-green-50 hover:border-green-300' 
                            : 'text-red-600 hover:bg-red-50 hover:border-red-300'
                        }`}
                        onClick={() => openBanModal(user)}
                      >
                        {user.is_banned ? 'Unban User' : 'Ban User'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && totalPages > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">
              Showing page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="h-8 text-xs bg-white" 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                className="h-8 text-xs bg-white" 
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Ban Reason Modal */}
      {banModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-100 animate-in zoom-in-95">
            <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
              <h3 className="font-bold text-red-800 flex items-center gap-2">
                <AlertTriangle size={18} /> Restrict Access
              </h3>
              <button onClick={() => setBanModalOpen(false)} className="text-red-400 hover:text-red-700">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleToggleBan} className="p-5 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  You are about to ban <span className="font-bold text-gray-900">{selectedUser.full_name}</span>. This will immediately revoke their access to the platform, including any active tests.
                </p>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Ban (Required)</label>
                <textarea 
                  required
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px] bg-white shadow-sm"
                  placeholder="e.g. Violation of terms, suspicious activity during test..."
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setBanModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isBanning} className="bg-red-600 hover:bg-red-700 text-white shadow-md">
                  Confirm Ban
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};