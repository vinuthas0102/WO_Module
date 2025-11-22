import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Mail, Briefcase, Building2, Calendar, Activity, Clock } from 'lucide-react';
import { User } from '../../types';
import { UserManagementService, UserActivityLog, UserManagementAudit } from '../../services/userManagementService';
import LoadingSpinner from '../common/LoadingSpinner';

interface UserDetailsModalProps {
  user: User;
  onClose: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'activity' | 'audit'>('info');
  const [activityLogs, setActivityLogs] = useState<UserActivityLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<UserManagementAudit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'activity') {
      loadActivityLogs();
    } else if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab, user.id]);

  const loadActivityLogs = async () => {
    setLoading(true);
    try {
      const logs = await UserManagementService.getUserActivityLogs(user.id);
      setActivityLogs(logs);
    } catch (error) {
      console.error('Error loading activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const logs = await UserManagementService.getUserManagementAudit(user.id);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return '🔓';
      case 'logout':
        return '🔒';
      case 'failed_login':
        return '❌';
      case 'password_change':
        return '🔑';
      case 'account_locked':
        return '🔐';
      case 'account_unlocked':
        return '🔓';
      default:
        return '📝';
    }
  };

  const getActivityLabel = (type: string) => {
    const labels: Record<string, string> = {
      'login': 'Logged in',
      'logout': 'Logged out',
      'failed_login': 'Failed login attempt',
      'password_change': 'Changed password',
      'account_locked': 'Account locked',
      'account_unlocked': 'Account unlocked'
    };
    return labels[type] || type;
  };

  const getAuditActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'user_created': 'User Created',
      'user_updated': 'User Updated',
      'user_deleted': 'User Deleted',
      'user_enabled': 'User Enabled',
      'user_disabled': 'User Disabled',
      'role_changed': 'Role Changed',
      'password_reset': 'Password Reset'
    };
    return labels[action] || action;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(date);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b border-gray-200">
          <div className="flex gap-1 px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'info'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              User Information
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'activity'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Activity History
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'audit'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Audit Trail
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <UserIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Full Name</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{user.name}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm font-medium">Email Address</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{user.email}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <Briefcase className="w-4 h-4" />
                    <span className="text-sm font-medium">Role</span>
                  </div>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <Building2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Department</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{user.department}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Last Login</span>
                  </div>
                  <p className="text-gray-900 font-semibold">
                    {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No activity recorded yet</p>
                </div>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getActivityIcon(log.activityType)}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {getActivityLabel(log.activityType)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {formatRelativeTime(log.createdAt)}
                        </p>
                        {log.ipAddress && (
                          <p className="text-xs text-gray-500 mt-1">
                            IP: {log.ipAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No audit records found</p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {getAuditActionLabel(log.action)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          By: {log.performedByName || 'System'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(log.createdAt)}
                        </p>
                      </div>
                    </div>
                    {log.remarks && (
                      <p className="text-xs text-gray-600 mt-2 italic">
                        {log.remarks}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
