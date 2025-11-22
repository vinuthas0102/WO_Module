import React, { useState } from 'react';
import { X, UserPlus, Copy, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserManagementService, CreateUserRequest } from '../../services/userManagementService';
import { IconDisplayType, IconSize } from '../../types';
import { UserPreferencesService } from '../../services/userPreferencesService';

interface UserCreateModalProps {
  onClose: () => void;
  onUserCreated: () => void;
}

const UserCreateModal: React.FC<UserCreateModalProps> = ({ onClose, onUserCreated }) => {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee' as 'employee' | 'dept_officer' | 'eo' | 'vendor' | 'finance',
    department: '',
    iconDisplayType: 'dropdown_menu' as IconDisplayType,
    iconSize: 'medium' as IconSize,
    showLabels: true,
    groupByCategory: false,
    animationEnabled: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setError('User not authenticated');
      return;
    }

    if (!formData.name || !formData.email || !formData.role || !formData.department) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const request: CreateUserRequest = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        createdBy: currentUser.id
      };

      const result = await UserManagementService.createUser(request);

      if (result.success && result.tempPassword && result.user) {
        // Save display preferences for the new user
        await UserPreferencesService.saveUserPreferences(result.user.id, {
          iconDisplayType: formData.iconDisplayType,
          iconSize: formData.iconSize,
          showLabels: formData.showLabels,
          groupByCategory: formData.groupByCategory,
          animationEnabled: formData.animationEnabled
        });

        setTempPassword(result.tempPassword);
        setShowPassword(true);
      } else {
        setError(result.message);
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const handleFinish = () => {
    onUserCreated();
    onClose();
  };

  if (showPassword) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Check className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              User Created Successfully!
            </h3>

            <p className="text-sm text-gray-600 text-center mb-6">
              A temporary password has been generated. Please share it with the user securely.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-sm font-medium text-yellow-800">
                  Temporary Password
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-yellow-300">
                <code className="flex-1 text-lg font-mono text-gray-900 select-all">
                  {tempPassword}
                </code>
                <button
                  onClick={handleCopyPassword}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors text-sm font-medium"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-yellow-700 mt-2">
                This password will expire in 30 days. The user should change it after first login.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-blue-900 mb-2">User Details</h4>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-blue-700">Name:</dt>
                  <dd className="text-blue-900 font-medium">{formData.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-blue-700">Email:</dt>
                  <dd className="text-blue-900 font-medium">{formData.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-blue-700">Role:</dt>
                  <dd className="text-blue-900 font-medium">
                    {formData.role === 'employee' && 'Employee'}
                    {formData.role === 'dept_officer' && 'Department Officer'}
                    {formData.role === 'eo' && 'Executive Officer'}
                    {formData.role === 'vendor' && 'Vendor'}
                    {formData.role === 'finance' && 'Finance Officer'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-blue-700">Department:</dt>
                  <dd className="text-blue-900 font-medium">{formData.department}</dd>
                </div>
              </dl>
            </div>

            <button
              onClick={handleFinish}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Create New User</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="user@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="employee">Employee</option>
              <option value="dept_officer">Department Officer</option>
              <option value="eo">Executive Officer</option>
              <option value="vendor">Vendor</option>
              <option value="finance">Finance Officer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., IT, HR, Finance"
              required
            />
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Display Preferences</h4>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon Display Type
              </label>
              <select
                value={formData.iconDisplayType}
                onChange={(e) => setFormData({ ...formData, iconDisplayType: e.target.value as IconDisplayType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="dropdown_menu">Dropdown Menu</option>
                <option value="carousel">Carousel</option>
                <option value="grid">Grid</option>
                <option value="horizontal_toolbar">Horizontal Toolbar</option>
                <option value="floating_action">Floating Action Button</option>
                <option value="vertical_sidebar">Vertical Sidebar</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon Size
              </label>
              <select
                value={formData.iconSize}
                onChange={(e) => setFormData({ ...formData, iconSize: e.target.value as IconSize })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.showLabels}
                  onChange={(e) => setFormData({ ...formData, showLabels: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Labels</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.groupByCategory}
                  onChange={(e) => setFormData({ ...formData, groupByCategory: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Group by Category</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.animationEnabled}
                  onChange={(e) => setFormData({ ...formData, animationEnabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enable Animations</span>
              </label>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              A secure temporary password will be automatically generated and displayed after user creation.
              The user will be required to change it on first login.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserCreateModal;
