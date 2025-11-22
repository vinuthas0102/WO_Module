import React, { useMemo } from 'react';
import { Edit, Trash2, Eye, Power, PowerOff, Key } from 'lucide-react';
import { User, ActionIconDefinition } from '../../types';
import { useAuth } from '../../context/AuthContext';
import IconDisplayWrapper from '../iconDisplay/IconDisplayWrapper';

interface UserListTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onViewDetails: (user: User) => void;
  onEnableDisable: (userId: string, enable: boolean) => void;
  onResetPassword: (userId: string) => void;
}

const UserListTable: React.FC<UserListTableProps> = ({
  users,
  onEdit,
  onDelete,
  onViewDetails,
  onEnableDisable,
  onResetPassword
}) => {
  const { displayPreferences } = useAuth();

  const getUserActions = (user: User): ActionIconDefinition[] => {
    return [
      {
        id: 'view',
        icon: Eye,
        label: 'View Details',
        action: () => onViewDetails(user),
        category: 'view',
        color: 'text-blue-600'
      },
      {
        id: 'edit',
        icon: Edit,
        label: 'Edit User',
        action: () => onEdit(user),
        category: 'edit',
        color: 'text-green-600'
      },
      {
        id: 'resetPassword',
        icon: Key,
        label: 'Reset Password',
        action: () => onResetPassword(user.id),
        category: 'admin',
        color: 'text-orange-600'
      },
      {
        id: 'disable',
        icon: PowerOff,
        label: 'Disable User',
        action: () => onEnableDisable(user.id, false),
        category: 'admin',
        color: 'text-yellow-600'
      },
      {
        id: 'delete',
        icon: Trash2,
        label: 'Delete User',
        action: () => onDelete(user.id),
        category: 'admin',
        color: 'text-red-600'
      }
    ];
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'EO':
        return 'bg-red-100 text-red-800';
      case 'DO':
        return 'bg-blue-100 text-blue-800';
      case 'EMPLOYEE':
        return 'bg-green-100 text-green-800';
      case 'VENDOR':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'EO':
        return 'Executive Officer';
      case 'DO':
        return 'Department Officer';
      case 'EMPLOYEE':
        return 'Employee';
      case 'VENDOR':
        return 'Vendor';
      default:
        return role;
    }
  };

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-6xl mb-4">👤</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
        <p className="text-gray-600">Try adjusting your filters or create a new user.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible">
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.department}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                  <div className="inline-flex justify-end">
                    <IconDisplayWrapper
                      actions={getUserActions(user)}
                      preferences={displayPreferences ?? undefined}
                      loading={!displayPreferences}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserListTable;
