import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Filter, RefreshCw, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserManagementService, UserListFilters } from '../../services/userManagementService';
import { User } from '../../types';
import UserListTable from './UserListTable';
import UserCreateModal from './UserCreateModal';
import UserEditModal from './UserEditModal';
import UserDetailsModal from './UserDetailsModal';
import LoadingSpinner from '../common/LoadingSpinner';

const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadUsers();
  }, [roleFilter, departmentFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const filters: UserListFilters = {};

      if (roleFilter) {
        filters.role = roleFilter;
      }

      if (departmentFilter) {
        filters.department = departmentFilter;
      }

      if (statusFilter !== 'all') {
        filters.active = statusFilter === 'active';
      }

      if (searchTerm) {
        filters.search = searchTerm;
      }

      const fetchedUsers = await UserManagementService.getAllUsers(filters);
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadUsers();
  };

  const handleCreateUser = () => {
    setShowCreateModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleUserCreated = () => {
    setShowCreateModal(false);
    loadUsers();
  };

  const handleUserUpdated = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    loadUsers();
  };

  const handleEnableDisableUser = async (userId: string, enable: boolean) => {
    if (!currentUser) return;

    try {
      const result = enable
        ? await UserManagementService.enableUser(userId, currentUser.id)
        : await UserManagementService.disableUser(userId, currentUser.id);

      if (result.success) {
        loadUsers();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!currentUser) return;

    if (!confirm('Are you sure you want to delete this user? This action will deactivate the user account.')) {
      return;
    }

    try {
      const result = await UserManagementService.deleteUser(userId, currentUser.id);

      if (result.success) {
        loadUsers();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!currentUser) return;

    if (!confirm('Are you sure you want to reset this user\'s password? A new temporary password will be generated.')) {
      return;
    }

    try {
      const result = await UserManagementService.resetUserPassword(userId, currentUser.id);

      if (result.success && result.tempPassword) {
        alert(`Password reset successful!\n\nNew temporary password: ${result.tempPassword}\n\nPlease share this password with the user securely. It will expire in 7 days.`);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Failed to reset password');
    }
  };

  const departments = Array.from(new Set(users.map(u => u.department))).sort();

  if (currentUser?.role !== 'EO') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to access user management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-sm text-gray-600">Manage system users, roles, and permissions</p>
              </div>
            </div>
            <button
              onClick={handleCreateUser}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Create User
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="employee">Employee</option>
              <option value="dept_officer">Department Officer</option>
              <option value="eo">Executive Officer</option>
              <option value="vendor">Vendor</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {users.length} user{users.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={loadUsers}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <UserListTable
            users={users}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onViewDetails={handleViewDetails}
            onEnableDisable={handleEnableDisableUser}
            onResetPassword={handleResetPassword}
          />
        )}

        {showCreateModal && (
          <UserCreateModal
            onClose={() => setShowCreateModal(false)}
            onUserCreated={handleUserCreated}
          />
        )}

        {showEditModal && selectedUser && (
          <UserEditModal
            user={selectedUser}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            onUserUpdated={handleUserUpdated}
          />
        )}

        {showDetailsModal && selectedUser && (
          <UserDetailsModal
            user={selectedUser}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedUser(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;
