import React, { useState, useEffect } from 'react';
import { X, Save, Edit } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { User, IconDisplayType, IconSize } from '../../types';
import { UserManagementService, UpdateUserRequest } from '../../services/userManagementService';
import { UserPreferencesService } from '../../services/userPreferencesService';

interface UserEditModalProps {
  user: User;
  onClose: () => void;
  onUserUpdated: () => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ user, onClose, onUserUpdated }) => {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role === 'DO' ? 'dept_officer' : user.role === 'EO' ? 'eo' : user.role === 'EMPLOYEE' ? 'employee' : user.role === 'VENDOR' ? 'vendor' : 'finance',
    department: user.department,
    iconDisplayType: 'dropdown_menu' as IconDisplayType,
    iconSize: 'medium' as IconSize,
    showLabels: true,
    groupByCategory: false,
    animationEnabled: true
  });
  const [loading, setLoading] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await UserPreferencesService.getUserPreferences(user.id);
        if (prefs) {
          setFormData(prev => ({
            ...prev,
            iconDisplayType: prefs.iconDisplayType,
            iconSize: prefs.iconSize,
            showLabels: prefs.showLabels,
            groupByCategory: prefs.groupByCategory,
            animationEnabled: prefs.animationEnabled
          }));
        }
      } catch (err) {
        console.error('Failed to load user preferences:', err);
      } finally {
        setLoadingPreferences(false);
      }
    };

    loadPreferences();
  }, [user.id]);

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
      const request: UpdateUserRequest = {
        id: user.id,
        name: formData.name,
        email: formData.email,
        role: formData.role as 'employee' | 'dept_officer' | 'eo' | 'vendor' | 'finance',
        department: formData.department,
        updatedBy: currentUser.id
      };

      const result = await UserManagementService.updateUser(request);

      if (result.success) {
        // Update display preferences
        await UserPreferencesService.saveUserPreferences(user.id, {
          iconDisplayType: formData.iconDisplayType,
          iconSize: formData.iconSize,
          showLabels: formData.showLabels,
          groupByCategory: formData.groupByCategory,
          animationEnabled: formData.animationEnabled
        });

        onUserUpdated();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full my-8 max-h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-lg sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(100vh-12rem)]">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
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
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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

          {!loadingPreferences && (
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
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-700">
              <strong>Note:</strong> Changing a user's role will affect their access permissions immediately.
              Ensure this change is intentional and authorized.
            </p>
          </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-white rounded-b-lg sticky bottom-0">
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditModal;
