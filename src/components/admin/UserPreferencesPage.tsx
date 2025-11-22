import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, Eye, Edit, Trash2, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { IconDisplayType, IconSize, ActionIconDefinition } from '../../types';
import IconDisplayWrapper from '../iconDisplay/IconDisplayWrapper';
import LoadingSpinner from '../common/LoadingSpinner';

const UserPreferencesPage: React.FC = () => {
  const { displayPreferences, updateDisplayPreferences, user } = useAuth();
  const [selectedDisplayType, setSelectedDisplayType] = useState<IconDisplayType>('dropdown_menu');
  const [selectedIconSize, setSelectedIconSize] = useState<IconSize>('medium');
  const [showLabels, setShowLabels] = useState(true);
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (displayPreferences) {
      setSelectedDisplayType(displayPreferences.iconDisplayType);
      setSelectedIconSize(displayPreferences.iconSize);
      setShowLabels(displayPreferences.showLabels);
      setGroupByCategory(displayPreferences.groupByCategory);
      setAnimationEnabled(displayPreferences.animationEnabled);
    }
  }, [displayPreferences]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    const success = await updateDisplayPreferences({
      iconDisplayType: selectedDisplayType,
      iconSize: selectedIconSize,
      showLabels,
      groupByCategory,
      animationEnabled
    });

    setSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert('Failed to save preferences. Please try again.');
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all preferences to default values?')) {
      return;
    }

    setSaving(true);
    const success = await updateDisplayPreferences({
      iconDisplayType: 'dropdown_menu',
      iconSize: 'medium',
      showLabels: true,
      groupByCategory: false,
      animationEnabled: true
    });

    setSaving(false);
    if (!success) {
      alert('Failed to reset preferences. Please try again.');
    }
  };

  const displayTypeOptions = [
    { value: 'dropdown_menu', label: 'Dropdown Menu', description: 'Classic vertical menu with click to open' },
    { value: 'carousel', label: 'Carousel', description: 'Horizontal scrollable icons with arrows' },
    { value: 'grid', label: 'Grid', description: 'Expandable 3x3 grid layout' },
    { value: 'horizontal_toolbar', label: 'Horizontal Toolbar', description: 'Always visible inline icon bar' },
    { value: 'floating_action', label: 'Floating Action Button', description: 'FAB with radial expansion' },
    { value: 'vertical_sidebar', label: 'Vertical Sidebar', description: 'Slide-in panel from right' }
  ];

  const iconSizeOptions = [
    { value: 'small', label: 'Small', description: 'Compact size for minimal UI' },
    { value: 'medium', label: 'Medium', description: 'Balanced size (recommended)' },
    { value: 'large', label: 'Large', description: 'Larger icons for better visibility' }
  ];

  const sampleActions: ActionIconDefinition[] = [
    { id: 'view', icon: Eye, label: 'View', action: () => {}, category: 'view', color: 'text-blue-600' },
    { id: 'edit', icon: Edit, label: 'Edit', action: () => {}, category: 'edit', color: 'text-green-600' },
    { id: 'delete', icon: Trash2, label: 'Delete', action: () => {}, category: 'admin', color: 'text-red-600' },
    { id: 'approve', icon: Check, label: 'Approve', action: () => {}, category: 'status', color: 'text-green-600' }
  ];

  const previewPreferences = {
    id: '',
    userId: '',
    iconDisplayType: selectedDisplayType,
    iconSize: selectedIconSize,
    showLabels,
    groupByCategory,
    animationEnabled,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access preferences.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Display Preferences</h1>
                <p className="text-sm text-gray-600">Customize how action icons are displayed</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className="text-sm text-green-600 font-medium">Saved successfully!</span>
              )}
              <button
                onClick={handleReset}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Default
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? <LoadingSpinner /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Icon Display Type
                </label>
                <div className="space-y-2">
                  {displayTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedDisplayType(option.value as IconDisplayType)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedDisplayType === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                        </div>
                        {selectedDisplayType === option.value && (
                          <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Icon Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {iconSizeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedIconSize(option.value as IconSize)}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        selectedIconSize === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Additional Options
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <div className="font-medium text-gray-900">Show Labels</div>
                    <div className="text-sm text-gray-600">Display text labels next to icons</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <div className="font-medium text-gray-900">Group by Category</div>
                    <div className="text-sm text-gray-600">Organize actions into categories</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={groupByCategory}
                    onChange={(e) => setGroupByCategory(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <div className="font-medium text-gray-900">Enable Animations</div>
                    <div className="text-sm text-gray-600">Smooth transitions and effects</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={animationEnabled}
                    onChange={(e) => setAnimationEnabled(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            <div>
              <div className="sticky top-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Live Preview
                </label>
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-gray-200 p-8 min-h-96 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-6">
                      This is how your action icons will appear:
                    </p>
                    <IconDisplayWrapper
                      actions={sampleActions}
                      preferences={previewPreferences}
                    />
                    <p className="text-xs text-gray-500 mt-6">
                      Click the action button above to see the display in action
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    About Display Preferences
                  </h3>
                  <p className="text-sm text-blue-800">
                    Your display preferences apply globally across all screens with action buttons.
                    Changes are saved per user and persist across sessions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPreferencesPage;
