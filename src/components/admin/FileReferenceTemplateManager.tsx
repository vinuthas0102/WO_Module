import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, Eye, Upload, X, CheckCircle, AlertCircle, FileJson } from 'lucide-react';
import { User, FileReferenceTemplate, FileReferenceTemplateJSON } from '../../types';
import { FileReferenceService } from '../../services/fileReferenceService';
import LoadingSpinner from '../common/LoadingSpinner';

interface FileReferenceTemplateManagerProps {
  user: User;
}

export const FileReferenceTemplateManager: React.FC<FileReferenceTemplateManagerProps> = ({ user }) => {
  const [templates, setTemplates] = useState<FileReferenceTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FileReferenceTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<FileReferenceTemplate | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, [showActiveOnly]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await FileReferenceService.getAllTemplates(showActiveOnly);
      setTemplates(data);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string, templateName: string) => {
    if (!confirm(`Are you sure you want to delete the template "${templateName}"?`)) {
      return;
    }

    try {
      await FileReferenceService.deleteTemplate(templateId);
      await loadTemplates();
    } catch (err) {
      alert(`Failed to delete template: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleToggleActive = async (template: FileReferenceTemplate) => {
    try {
      await FileReferenceService.updateTemplate(template.id, {
        isActive: !template.isActive
      });
      await loadTemplates();
    } catch (err) {
      alert(`Failed to update template: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handlePreview = (template: FileReferenceTemplate) => {
    setPreviewTemplate(template);
    setShowPreviewModal(true);
  };

  if (user.role !== 'EO') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
        <p className="font-semibold">Access Denied</p>
        <p className="text-sm mt-1">Only EO users can access file reference template management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FileJson className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">File Reference Templates</h2>
          </div>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setShowUploadModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Template</span>
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium mb-2">About File Reference Templates</p>
              <p className="text-xs text-blue-700 mb-2">
                Upload JSON files to define file references that managers must upload when creating workflow tasks.
                Each template specifies required documents and whether they are mandatory or optional.
              </p>
              <div className="bg-white border border-blue-200 rounded p-2 mt-2">
                <p className="text-xs font-medium text-blue-900 mb-1">JSON Format:</p>
                <pre className="text-xs text-gray-700 overflow-x-auto">
{`{
  "fileReferences": ["Document1.pdf", "Report.docx"],
  "taskTitle": "Optional Title",
  "description": "Optional Description",
  "mandatoryFlags": [true, false]
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show active templates only</span>
          </label>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 mb-4">
            {error}
          </div>
        )}

        {!loading && templates.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center text-gray-500">
            <FileJson className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No templates found. Click "Upload Template" to create your first template.</p>
          </div>
        )}

        {!loading && templates.length > 0 && (
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`border ${template.isActive ? 'border-gray-200 bg-gray-50' : 'border-gray-300 bg-gray-100 opacity-75'} rounded-lg p-4 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{template.templateName}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {template.jsonContent.fileReferences.length} file reference{template.jsonContent.fileReferences.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {template.description && (
                      <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                    )}

                    <div className="text-xs text-gray-500">
                      <span>Created: {new Date(template.createdAt).toLocaleDateString()}</span>
                      <span className="mx-2">•</span>
                      <span>Updated: {new Date(template.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">File References:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.jsonContent.fileReferences.map((ref, index) => {
                          const isMandatory = template.jsonContent.mandatoryFlags?.[index] || false;
                          return (
                            <span
                              key={index}
                              className={`text-xs px-2 py-0.5 rounded ${isMandatory ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-200 text-gray-700'}`}
                            >
                              {ref} {isMandatory && '(Required)'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handlePreview(template)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Preview JSON"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingTemplate(template);
                        setShowUploadModal(true);
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Edit template"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(template)}
                      className={`p-2 rounded transition-colors ${template.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                      title={template.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {template.isActive ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(template.id, template.templateName)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUploadModal && (
        <UploadTemplateModal
          user={user}
          template={editingTemplate}
          onClose={() => {
            setShowUploadModal(false);
            setEditingTemplate(null);
          }}
          onSuccess={() => {
            setShowUploadModal(false);
            setEditingTemplate(null);
            loadTemplates();
          }}
        />
      )}

      {showPreviewModal && previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewTemplate(null);
          }}
        />
      )}
    </div>
  );
};

interface UploadTemplateModalProps {
  user: User;
  template: FileReferenceTemplate | null;
  onClose: () => void;
  onSuccess: () => void;
}

const UploadTemplateModal: React.FC<UploadTemplateModalProps> = ({ user, template, onClose, onSuccess }) => {
  const [templateName, setTemplateName] = useState(template?.templateName || '');
  const [description, setDescription] = useState(template?.description || '');
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [jsonContent, setJsonContent] = useState<FileReferenceTemplateJSON | null>(template?.jsonContent || null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Please select a JSON file');
      setJsonFile(null);
      setJsonContent(null);
      setValidationResult(null);
      return;
    }

    setJsonFile(file);
    setError(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validation = FileReferenceService.validateTemplateJSON(parsed);
      setValidationResult(validation);

      if (validation.valid) {
        setJsonContent(parsed);
      } else {
        setJsonContent(null);
      }
    } catch (err) {
      setError('Invalid JSON file: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setJsonContent(null);
      setValidationResult({ valid: false, error: 'Invalid JSON format' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }

    if (!jsonContent && !template) {
      setError('Please upload a JSON file');
      return;
    }

    if (validationResult && !validationResult.valid) {
      setError('Please fix JSON validation errors before submitting');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (template) {
        await FileReferenceService.updateTemplate(template.id, {
          templateName: templateName.trim(),
          description: description.trim(),
          jsonContent: jsonContent || template.jsonContent,
        });
      } else {
        await FileReferenceService.createTemplate({
          templateName: templateName.trim(),
          description: description.trim(),
          jsonContent: jsonContent!,
          uploadedBy: user.id,
        });
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              {template ? 'Edit Template' : 'Upload Template'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="e.g., Project Initiation Documents"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description of this template"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                JSON File {!template && <span className="text-red-500">*</span>}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                  id="json-upload"
                />
                <label htmlFor="json-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {jsonFile ? jsonFile.name : 'Click to upload JSON file'}
                  </p>
                </label>
              </div>
            </div>

            {validationResult && (
              <div className={`border rounded-md p-3 ${validationResult.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center space-x-2">
                  {validationResult.valid ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">JSON is valid</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium text-red-800">{validationResult.error}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {jsonContent && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">
                    <strong>File References:</strong> {jsonContent.fileReferences.length}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {jsonContent.fileReferences.map((ref, index) => (
                      <span
                        key={index}
                        className={`text-xs px-2 py-0.5 rounded ${jsonContent.mandatoryFlags?.[index] ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-700'}`}
                      >
                        {ref} {jsonContent.mandatoryFlags?.[index] && '(Required)'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (validationResult && !validationResult.valid)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

interface PreviewModalProps {
  template: FileReferenceTemplate;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ template, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{template.templateName}</h2>
              {template.description && (
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 overflow-x-auto">
              <pre className="text-xs text-gray-800">
                {JSON.stringify(template.jsonContent, null, 2)}
              </pre>
            </div>
          </div>

          <div className="flex justify-end p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileReferenceTemplateManager;
