import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, File, Download, Eye, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { FileService, DocumentMetadata } from '../../services/fileService';
import { useAuth } from '../../context/AuthContext';
import { WorkflowStep } from '../../types';

interface WorkflowDocumentUploadProps {
  step: WorkflowStep;
  ticketId: string;
  onDocumentChange?: () => void;
  onViewDocument?: (document: DocumentMetadata) => void;
}

const WorkflowDocumentUpload: React.FC<WorkflowDocumentUploadProps> = ({
  step,
  ticketId,
  onDocumentChange,
  onViewDocument,
}) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [isMandatory, setIsMandatory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, [step.id]);

  const loadDocuments = async () => {
    try {
      const docs = await FileService.getStepDocuments(step.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    if (!user) {
      setError('You must be logged in to upload files');
      return;
    }

    for (const file of files) {
      const validation = FileService.validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        continue;
      }

      try {
        setError(null);
        setUploading(true);
        setUploadProgress(0);

        const isCompletionCert = step.completionCertificateRequired && isMandatory;

        await FileService.uploadStepDocument(
          {
            file,
            stepId: step.id,
            ticketId,
            userId: user.id,
            isMandatory,
            isCompletionCertificate: isCompletionCert,
          },
          (progress) => {
            setUploadProgress(progress.percentage);
          }
        );

        await loadDocuments();
        if (onDocumentChange) {
          onDocumentChange();
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Upload failed:', error);
        setError(error instanceof Error ? error.message : 'Upload failed');
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const handleDownload = async (document: DocumentMetadata) => {
    try {
      if (!document.storagePath) {
        throw new Error('Document storage path not found');
      }

      const url = await FileService.getFileUrl(document.storagePath);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      setError(error instanceof Error ? error.message : 'Download failed');
    }
  };

  const handleView = async (document: DocumentMetadata) => {
    if (onViewDocument) {
      onViewDocument(document);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await FileService.deleteDocument(documentId, user.id);
      await loadDocuments();
      if (onDocumentChange) {
        onDocumentChange();
      }
    } catch (error) {
      console.error('Delete failed:', error);
      setError(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const mandatoryCount = documents.filter((d) => d.isMandatory).length;
  const completionCertCount = documents.filter((d) => d.isCompletionCertificate).length;
  const hasMandatoryDocs = (step.mandatory_documents?.length || 0) > 0;
  const mandatoryDocsFulfilled = mandatoryCount >= (step.mandatory_documents?.length || 0);
  const hasCompletionCert = completionCertCount > 0;
  const isDORole = user?.role === 'DO';

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-600 hover:text-red-800 mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {isDORole && (
        <div
          className={`p-3 rounded-md border ${
            hasCompletionCert
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {hasCompletionCert ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span
              className={`text-sm font-medium ${
                hasCompletionCert ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {hasCompletionCert
                ? 'Completion certificate uploaded'
                : 'Completion certificate required for DO to complete this step'}
            </span>
          </div>
        </div>
      )}

      {hasMandatoryDocs && (
        <div
          className={`p-3 rounded-md border ${
            mandatoryDocsFulfilled
              ? 'bg-green-50 border-green-200'
              : 'bg-orange-50 border-orange-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {mandatoryDocsFulfilled ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-orange-600" />
            )}
            <span
              className={`text-sm font-medium ${
                mandatoryDocsFulfilled ? 'text-green-800' : 'text-orange-800'
              }`}
            >
              {mandatoryDocsFulfilled
                ? 'All mandatory documents uploaded'
                : `${mandatoryCount} of ${step.mandatory_documents?.length || 0} mandatory documents uploaded`}
            </span>
          </div>
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInput}
          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
          disabled={uploading}
        />

        {uploading ? (
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-blue-500 mx-auto animate-pulse" />
            <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-8 h-8 text-gray-400 mx-auto" />
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Click to upload
              </button>
              <span className="text-gray-500 text-sm"> or drag and drop</span>
            </div>
            <p className="text-xs text-gray-500">
              PDF, Images, Word, Excel (max 5MB)
            </p>

            <div className="flex items-center justify-center space-x-2 pt-2">
              <input
                type="checkbox"
                id={`mandatory-${step.id}`}
                checked={isMandatory}
                onChange={(e) => setIsMandatory(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor={`mandatory-${step.id}`}
                className="text-sm text-gray-700 cursor-pointer"
              >
                {isDORole ? 'Mark as completion certificate' : 'Mark as mandatory document'}
              </label>
            </div>
          </div>
        )}
      </div>

      {documents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            Uploaded Documents ({documents.length})
          </h4>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-2xl flex-shrink-0">
                    {FileService.getFileIcon(doc.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.name}
                      {doc.isMandatory && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                          Mandatory
                        </span>
                      )}
                      {doc.isCompletionCertificate && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                          Completion Certificate
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {FileService.formatFileSize(doc.size)} •{' '}
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {FileService.canPreview(doc.type) && (
                    <button
                      onClick={() => handleView(doc)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="View document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {user && (doc.uploadedBy === user.id || user.role === 'EO') && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowDocumentUpload;
