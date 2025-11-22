import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, FileText, X, ExternalLink } from 'lucide-react';
import { FileReferenceWithStatus } from '../../types';
import { FileReferenceService } from '../../services/fileReferenceService';
import { FileService, DocumentMetadata } from '../../services/fileService';
import { useAuth } from '../../context/AuthContext';

interface FileReferenceUploadProps {
  stepId: string;
  ticketId: string;
  onUploadComplete?: () => void;
  onViewDocument?: (document: DocumentMetadata) => void;
}

export const FileReferenceUpload: React.FC<FileReferenceUploadProps> = ({
  stepId,
  ticketId,
  onUploadComplete,
  onViewDocument
}) => {
  const { user } = useAuth();
  const [fileReferences, setFileReferences] = useState<FileReferenceWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingRefId, setUploadingRefId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFileReferences();
  }, [stepId]);

  const loadFileReferences = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('FileReferenceUpload: Loading file references for step:', stepId);
      const refs = await FileReferenceService.getStepFileReferences(stepId);
      console.log('FileReferenceUpload: Loaded file references:', refs.length, refs);
      setFileReferences(refs);
    } catch (err) {
      console.error('FileReferenceUpload: Failed to load file references:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to load file references';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (reference: FileReferenceWithStatus, file: File) => {
    if (!user) return;

    try {
      setUploadingRefId(reference.id);
      setError(null);

      const uploadedDoc = await FileService.uploadStepDocument({
        file,
        stepId,
        ticketId,
        userId: user.id,
        isMandatory: reference.isMandatory,
        isCompletionCertificate: false,
      });

      await FileReferenceService.updateStepFileReference(reference.id, {
        documentId: uploadedDoc.id,
        uploadedBy: user.id,
        uploadedAt: new Date(),
      });

      await loadFileReferences();
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err) {
      console.error('File upload failed:', err);
      setError(`Failed to upload file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploadingRefId(null);
    }
  };

  const handleFileInputChange = (reference: FileReferenceWithStatus, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = FileService.validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    handleFileUpload(reference, file);
  };

  const handleViewDocument = async (reference: FileReferenceWithStatus) => {
    if (!reference.documentId) return;

    try {
      const docs = await FileService.getStepDocuments(stepId);
      const doc = docs.find(d => d.id === reference.documentId);

      if (doc) {
        if (onViewDocument) {
          onViewDocument(doc);
        } else if (doc.storagePath) {
          const url = await FileService.getFileUrl(doc.storagePath);
          window.open(url, '_blank');
        }
      }
    } catch (err) {
      alert('Failed to open document');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-600 mt-2">Loading file references...</p>
      </div>
    );
  }

  if (fileReferences.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-700 mb-1">No File References</h4>
            <p className="text-xs text-gray-600">
              No file reference template was selected when this workflow step was created.
              File references can only be added during workflow creation by the EO.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const mandatoryCount = fileReferences.filter(ref => ref.isMandatory).length;
  const completedMandatoryCount = fileReferences.filter(ref => ref.isMandatory && ref.documentId).length;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 mb-1">File References Required</h4>
            <p className="text-xs text-blue-700 mb-2">
              Upload the following documents for this workflow step. Items marked as "Required" must be uploaded before completion.
            </p>
            {mandatoryCount > 0 && (
              <div className="flex items-center space-x-2 text-xs">
                <span className={`font-medium ${completedMandatoryCount === mandatoryCount ? 'text-green-700' : 'text-orange-700'}`}>
                  Progress: {completedMandatoryCount}/{mandatoryCount} required files uploaded
                </span>
                {completedMandatoryCount === mandatoryCount && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-2">
        {fileReferences.map((reference) => {
          const isUploading = uploadingRefId === reference.id;
          const isUploaded = !!reference.documentId;

          return (
            <div
              key={reference.id}
              className={`border-2 rounded-lg p-3 transition-all ${
                reference.isMandatory
                  ? isUploaded
                    ? 'border-green-300 bg-green-50'
                    : 'border-red-300 bg-red-50'
                  : isUploaded
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h5 className="text-sm font-semibold text-gray-900">{reference.referenceName}</h5>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        reference.isMandatory
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {reference.isMandatory ? 'Required' : 'Optional'}
                    </span>
                    {isUploaded && (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-300 flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Uploaded</span>
                      </span>
                    )}
                  </div>

                  {isUploaded && reference.documentName && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">File:</span> {reference.documentName}
                      {reference.documentSize && (
                        <span className="ml-2">({FileService.formatFileSize(reference.documentSize)})</span>
                      )}
                    </div>
                  )}

                  {isUploading && (
                    <div className="flex items-center space-x-2 text-xs text-blue-600 mt-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      <span>Uploading...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {isUploaded ? (
                    <button
                      onClick={() => handleViewDocument(reference)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  ) : (
                    <>
                      <input
                        type="file"
                        id={`file-ref-${reference.id}`}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                        onChange={(e) => handleFileInputChange(reference, e)}
                        disabled={isUploading}
                      />
                      <label
                        htmlFor={`file-ref-${reference.id}`}
                        className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                          isUploading
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileReferenceUpload;
