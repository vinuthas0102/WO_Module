import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Save } from 'lucide-react';
import { WorkOrderSpecMaster } from '../../types';
import { WorkOrderSpecService } from '../../services/workOrderSpecService';
import LoadingSpinner from '../common/LoadingSpinner';

interface SpecMasterManagerProps {
  userId: string;
  onClose: () => void;
}

const SpecMasterManager: React.FC<SpecMasterManagerProps> = ({ userId, onClose }) => {
  const [specs, setSpecs] = useState<WorkOrderSpecMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSpec, setEditingSpec] = useState<WorkOrderSpecMaster | null>(null);
  const [formData, setFormData] = useState({
    specCode: '',
    description: '',
    workChunk: '',
    category: '',
    defaultQuantity: 0,
    unit: 'sqft',
    isActive: true,
  });

  const categories = ['Civil Work', 'Electrical Work', 'Plumbing Work', 'HVAC Work', 'Carpentry', 'Painting'];
  const units = ['nos', 'kgs', 'meters', 'sqft', 'sqm', 'liters', 'units', 'boxes', 'bags', 'rolls'];

  useEffect(() => {
    loadSpecs();
  }, []);

  const loadSpecs = async () => {
    try {
      setLoading(true);
      const data = await WorkOrderSpecService.getAllSpecsMaster(false);
      setSpecs(data);
    } catch (error) {
      console.error('Error loading specs:', error);
      alert('Failed to load specs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSpec) {
        await WorkOrderSpecService.updateSpecMaster(editingSpec.id, formData);
      } else {
        await WorkOrderSpecService.createSpecMaster(formData as any, userId);
      }

      await loadSpecs();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving spec:', error);
      alert('Failed to save spec');
    }
  };

  const handleEdit = (spec: WorkOrderSpecMaster) => {
    setEditingSpec(spec);
    setFormData({
      specCode: spec.specCode,
      description: spec.description,
      workChunk: spec.workChunk,
      category: spec.category,
      defaultQuantity: spec.defaultQuantity,
      unit: spec.unit,
      isActive: spec.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this spec?')) return;

    try {
      await WorkOrderSpecService.deleteSpecMaster(id);
      await loadSpecs();
    } catch (error) {
      console.error('Error deleting spec:', error);
      alert('Failed to delete spec. It may be in use.');
    }
  };

  const resetForm = () => {
    setFormData({
      specCode: '',
      description: '',
      workChunk: '',
      category: '',
      defaultQuantity: 0,
      unit: 'sqft',
      isActive: true,
    });
    setEditingSpec(null);
  };

  const filteredSpecs = specs.filter(
    spec =>
      spec.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spec.specCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spec.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spec.workChunk.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">Specification Master Management</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search specifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="ml-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Spec</span>
              </button>
            </div>

            {showForm && (
              <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                <h3 className="text-sm font-semibold mb-3">
                  {editingSpec ? 'Edit Specification' : 'Add New Specification'}
                </h3>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Spec Code *
                      </label>
                      <input
                        type="text"
                        value={formData.specCode}
                        onChange={(e) => setFormData({ ...formData, specCode: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Work Chunk *
                      </label>
                      <textarea
                        value={formData.workChunk}
                        onChange={(e) => setFormData({ ...formData, workChunk: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        required
                        placeholder="Describe the work that needs to be done..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Default Quantity
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.defaultQuantity}
                        onChange={(e) => setFormData({ ...formData, defaultQuantity: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unit *
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {units.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        resetForm();
                      }}
                      className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingSpec ? 'Update' : 'Save'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Spec Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work Chunk
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Default Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSpecs.map((spec) => (
                    <tr key={spec.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {spec.specCode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {spec.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                        {spec.workChunk}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {spec.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {spec.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {spec.defaultQuantity}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            spec.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {spec.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(spec)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(spec.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredSpecs.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {searchTerm ? 'No specs found matching your search.' : 'No specs available. Add your first spec to get started.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecMasterManager;
