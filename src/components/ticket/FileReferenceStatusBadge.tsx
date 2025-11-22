import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { FileReferenceService } from '../../services/fileReferenceService';
import { FileReferenceWithStatus } from '../../types';

interface FileReferenceStatusBadgeProps {
  stepId: string;
}

export const FileReferenceStatusBadge: React.FC<FileReferenceStatusBadgeProps> = ({ stepId }) => {
  const [fileReferences, setFileReferences] = useState<FileReferenceWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const refs = await FileReferenceService.getStepFileReferences(stepId);
        setFileReferences(refs);
      } catch (error) {
        console.error('Failed to load file reference status:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRefs();
  }, [stepId]);

  if (loading || fileReferences.length === 0) {
    return null;
  }

  const totalRefs = fileReferences.length;
  const mandatoryRefs = fileReferences.filter(ref => ref.isMandatory).length;
  const uploadedRefs = fileReferences.filter(ref => ref.documentId).length;
  const uploadedMandatory = fileReferences.filter(ref => ref.isMandatory && ref.documentId).length;

  const allMandatoryUploaded = mandatoryRefs === uploadedMandatory;
  const allUploaded = uploadedRefs === totalRefs;

  let badgeColor = 'bg-red-100 text-red-800 border-red-300';
  let icon = <AlertCircle className="w-3 h-3" />;

  if (allUploaded) {
    badgeColor = 'bg-green-100 text-green-800 border-green-300';
    icon = <CheckCircle className="w-3 h-3" />;
  } else if (allMandatoryUploaded) {
    badgeColor = 'bg-yellow-100 text-yellow-800 border-yellow-300';
    icon = <FileText className="w-3 h-3" />;
  }

  return (
    <span
      className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full border ${badgeColor}`}
      title={`File References: ${uploadedRefs}/${totalRefs} uploaded (${uploadedMandatory}/${mandatoryRefs} mandatory)`}
    >
      {icon}
      <span>{uploadedRefs}/{totalRefs} files</span>
    </span>
  );
};

export default FileReferenceStatusBadge;
