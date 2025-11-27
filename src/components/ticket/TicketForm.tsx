import React, { useState } from 'react';
import { X, Upload, Copy, Info } from 'lucide-react';
import { Ticket } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { FileService } from '../../services/fileService';
import { getModuleTerminology } from '../../lib/utils';

interface TicketFormProps {
  isOpen: boolean;
  onClose: () => void;
  ticket?: Ticket;
  copiedTicket?: Ticket | null;
  copiedAttachmentIds?: string[];
}

const TicketForm: React.FC<TicketFormProps> = ({ isOpen, onClose, ticket, copiedTicket, copiedAttachmentIds = [] }) => {
  const { user } = useAuth();
  const { selectedModule } = useAuth();
  const { createTicket, updateTicket, users, tickets } = useTickets();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [copyingAttachments, setCopyingAttachments] = useState(false);
  const [attachmentCopyStatus, setAttachmentCopyStatus] = useState<string>('');
  
  // Get module-specific ticket prefix
  const getTicketPrefix = (moduleId: string): string => {
    const modulePrefixes: Record<string, string> = {
      '550e8400-e29b-41d4-a716-446655440101': 'MTKT', // Maintenance Module
      '550e8400-e29b-41d4-a716-446655440102': 'CTKT', // Complaints Tracker
      '550e8400-e29b-41d4-a716-446655440103': 'GTKT', // Grievances Module
      '550e8400-e29b-41d4-a716-446655440104': 'RTKT', // RTI Tracker
      '550e8400-e29b-41d4-a716-446655440105': 'PTKT', // Project Execution Plan (PEP)
      '550e8400-e29b-41d4-a716-446655440106': 'WO'    // Work Order Management
    };
    return modulePrefixes[moduleId] || 'TKT';
  };

  // Generate ticket number for new tickets
  const generateTicketNumber = () => {
    if (ticket) return ticket.ticketNumber; // Use existing ticket number for editing
    
    const prefix = selectedModule ? getTicketPrefix(selectedModule.id) : 'TKT';
    
    // Get all tickets for the current module and extract their numbers
    const moduleTickets = tickets
      .filter(t => t.moduleId === selectedModule?.id) // Filter by current module
    
    const existingNumbers = moduleTickets.map(t => {
      const match = t.ticketNumber.match(new RegExp(`${prefix}-(\\d+)`));
      return match ? parseInt(match[1]) : 0;
    });
    
    // Find the next available number
    const nextNumber = Math.max(...existingNumbers, 0) + 1;
    return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
  };

  const sourceTicket = ticket || copiedTicket;
  const isCopying = !ticket && !!copiedTicket;
  const isEditing = !!ticket;

  const terminology = getModuleTerminology(selectedModule?.id, 'singular');

  const [formData, setFormData] = useState({
    ticketNumber: ticket?.ticketNumber || '', // Will be generated on form render
    title: sourceTicket?.title || '',
    description: sourceTicket?.description || '',
    status: ticket?.status || 'DRAFT',
    priority: sourceTicket?.priority || 'MEDIUM',
    category: sourceTicket?.category || 'General',
    assignedTo: ticket?.assignedTo || '',
    estCompletionDate: ticket?.dueDate ? ticket.dueDate.toISOString().split('T')[0] : '',
    department: sourceTicket?.department || user?.department || '',
    propertyId: sourceTicket?.propertyId || 'PROP001',
    propertyLocation: sourceTicket?.propertyLocation || 'Location01',
    contractorName: (sourceTicket?.data as any)?.contractorName || '',
    contractorContact: (sourceTicket?.data as any)?.contractorContact || '',
    estimatedCost: (sourceTicket?.data as any)?.estimatedCost || '',
    workOrderType: (sourceTicket?.data as any)?.workOrderType || 'General'
  });

  // Update ticket number when component mounts or tickets change
  React.useEffect(() => {
    if (!ticket) {
      setFormData(prev => ({
        ...prev,
        ticketNumber: generateTicketNumber()
      }));
    }
  }, [tickets, selectedModule]);

  // Update form data when copiedTicket changes
  React.useEffect(() => {
    if (copiedTicket && !ticket) {
      setFormData({
        ticketNumber: generateTicketNumber(),
        title: copiedTicket.title || '',
        description: copiedTicket.description || '',
        status: 'DRAFT',
        priority: copiedTicket.priority || 'MEDIUM',
        category: copiedTicket.category || 'General',
        assignedTo: '',
        estCompletionDate: '',
        department: copiedTicket.department || user?.department || '',
        propertyId: copiedTicket.propertyId || 'PROP001',
        propertyLocation: copiedTicket.propertyLocation || 'Location01',
        contractorName: (copiedTicket.data as any)?.contractorName || '',
        contractorContact: (copiedTicket.data as any)?.contractorContact || '',
        estimatedCost: (copiedTicket.data as any)?.estimatedCost || '',
        workOrderType: (copiedTicket.data as any)?.workOrderType || 'General'
      });
    }
  }, [copiedTicket]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedModule) return;

    setLoading(true);
    try {
      const ticketData: any = {
        moduleId: selectedModule.id,
        title: formData.title,
        description: formData.description,
        status: formData.status as const,
        priority: formData.priority as const,
        category: formData.category,
        assignedTo: formData.assignedTo || undefined,
        department: formData.department,
        dueDate: formData.estCompletionDate ? new Date(formData.estCompletionDate) : undefined,
        propertyId: formData.propertyId,
        propertyLocation: formData.propertyLocation,
        createdBy: user.id,
      };

      // Add Work Order specific data
      if (selectedModule.id === '550e8400-e29b-41d4-a716-446655440106') {
        ticketData.data = {
          workOrderType: formData.workOrderType,
          contractorName: formData.contractorName,
          contractorContact: formData.contractorContact,
          estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        };
      }

      let newTicketId: string | undefined;

      if (isEditing && ticket) {
        await updateTicket(ticket.id, ticketData);
      } else {
        newTicketId = await createTicket(ticketData, copiedTicket?.id);
      }

      if (newTicketId) {
        if (files && files.length > 0) {
          setCopyingAttachments(true);
          setAttachmentCopyStatus(`Uploading ${files.length} file${files.length !== 1 ? 's' : ''}...`);

          try {
            let uploadedCount = 0;
            let failedCount = 0;
            const errors: string[] = [];

            for (let i = 0; i < files.length; i++) {
              try {
                await FileService.uploadStepDocument({
                  file: files[i],
                  ticketId: newTicketId,
                  userId: user.id,
                  isMandatory: false,
                });
                uploadedCount++;
              } catch (error) {
                failedCount++;
                errors.push(`${files[i].name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }

            if (uploadedCount > 0) {
              setAttachmentCopyStatus(`Successfully uploaded ${uploadedCount} file${uploadedCount !== 1 ? 's' : ''}`);
            }

            if (failedCount > 0) {
              console.error('File upload errors:', errors);
              alert(
                `Ticket created successfully, but ${failedCount} file${failedCount !== 1 ? 's' : ''} failed to upload:\n${errors.slice(0, 3).join('\n')}`
              );
            }
          } catch (error) {
            console.error('Error uploading files:', error);
            alert('Ticket created successfully, but files failed to upload.');
          } finally {
            setCopyingAttachments(false);
            setTimeout(() => setAttachmentCopyStatus(''), 2000);
          }
        }

        if (copiedTicket && copiedAttachmentIds.length > 0) {
          setCopyingAttachments(true);
          setAttachmentCopyStatus(`Copying ${copiedAttachmentIds.length} attachment${copiedAttachmentIds.length !== 1 ? 's' : ''}...`);

          try {
            const copyResult = await FileService.copyTicketAttachments(
              copiedTicket.id,
              newTicketId,
              user.id,
              copiedAttachmentIds
            );

            if (copyResult.successCount > 0) {
              setAttachmentCopyStatus(
                `Successfully copied ${copyResult.successCount} attachment${copyResult.successCount !== 1 ? 's' : ''}`
              );
            }

            if (copyResult.failedCount > 0) {
              console.error('Attachment copy errors:', copyResult.errors);
              alert(
                `Ticket created successfully, but ${copyResult.failedCount} attachment${copyResult.failedCount !== 1 ? 's' : ''} failed to copy:\n${copyResult.errors.slice(0, 3).join('\n')}`
              );
            }
          } catch (error) {
            console.error('Error copying attachments:', error);
            alert('Ticket created successfully, but attachments failed to copy.');
          } finally {
            setCopyingAttachments(false);
            setTimeout(() => setAttachmentCopyStatus(''), 2000);
          }
        }
      }

      setTimeout(() => {
        onClose();
      }, copyingAttachments ? 2000 : 0);
      // Reset form data
      setFormData({
        ticketNumber: '', // Will be regenerated by useEffect
        title: '',
        description: '',
        status: 'DRAFT',
        priority: 'MEDIUM',
        category: 'General',
        assignedTo: '',
        estCompletionDate: '',
        department: user?.department || '',
        propertyId: 'PROP001',
        propertyLocation: 'Location01'
      });
      setFiles(null);
    } catch (error) {
      console.error('Ticket creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save ticket';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const availableUsers = users.filter(u => {
    if (user?.role === 'EO') return true;
    if (user?.role === 'DO') return u.department === user.department;
    return u.id === user?.id;
  });

  const availableDepartments = [...new Set(users.map(u => u.department))];
  const availableCategories = selectedModule?.config?.categories || ['General'];

  // Debug logging to help identify the issue
  console.log('Selected Module:', selectedModule);
  console.log('Module Config:', selectedModule?.config);
  console.log('Available Categories:', availableCategories);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isEditing ? `Edit ${terminology}` : isCopying ? `Create New ${terminology} from Copy` : `Create New ${terminology}`}
              </h2>
              {isCopying && copiedTicket && (
                <div className="mt-2 flex items-center space-x-2 text-sm">
                  <div className="flex items-center space-x-1 text-blue-600">
                    <Copy className="w-4 h-4" />
                    <span className="font-medium">Copied from:</span>
                  </div>
                  <span className="font-mono text-blue-700 font-semibold">{copiedTicket.ticketNumber}</span>
                  <span className="text-gray-500">-</span>
                  <span className="text-gray-700">{copiedTicket.title}</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto">
            {isCopying && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">Creating from Copy</h3>
                    <p className="text-xs text-blue-700">
                      The following fields have been pre-filled from the original ticket: Title, Description, Priority, Category, Department, and Property details. You can modify any field before creating the new ticket.
                    </p>
                    {copiedAttachmentIds.length > 0 && (
                      <p className="text-xs text-blue-700 mt-2">
                        <strong>{copiedAttachmentIds.length}</strong> attachment{copiedAttachmentIds.length !== 1 ? 's' : ''} will be copied to the new ticket.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {copyingAttachments && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  <p className="text-sm text-green-800 font-medium">{attachmentCopyStatus}</p>
                </div>
              </div>
            )}
            {!copyingAttachments && attachmentCopyStatus && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-800 font-medium">{attachmentCopyStatus}</p>
                </div>
              </div>
            )}
            <div className="space-y-6">
              {/* Ticket Number and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Ticket #
                  </label>
                  <input
                    type="text"
                    value={formData.ticketNumber}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <input
                    type="text"
                    value={formData.status}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    disabled
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Brief description..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Detailed description..."
                />
              </div>

              {/* Property ID and Property Location - Only for Employees */}
              {user?.role === 'EMPLOYEE' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Property ID *
                    </label>
                    <select
                      value={formData.propertyId}
                      onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="PROP001">PROP001</option>
                      <option value="PROP002">PROP002</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Property Location *
                    </label>
                    <select
                      value={formData.propertyLocation}
                      onChange={(e) => setFormData({ ...formData, propertyLocation: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="Location01">Location01</option>
                      <option value="Location02">Location02</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Priority and Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {availableCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Est Completion Date
                  </label>
                  <input
                    type="date"
                    value={formData.estCompletionDate}
                    onChange={(e) => setFormData({ ...formData, estCompletionDate: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Work Order Specific Fields */}
              {selectedModule?.id === '550e8400-e29b-41d4-a716-446655440106' && (
                <>
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Work Order Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Work Order Type *
                        </label>
                        <select
                          value={formData.workOrderType}
                          onChange={(e) => setFormData({ ...formData, workOrderType: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="General">General</option>
                          <option value="Construction">Construction</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Repair">Repair</option>
                          <option value="Installation">Installation</option>
                          <option value="Inspection">Inspection</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Estimated Cost (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.estimatedCost}
                          onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter estimated cost"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Contractor Name
                        </label>
                        <input
                          type="text"
                          value={formData.contractorName}
                          onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter contractor name"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Contractor Contact
                        </label>
                        <input
                          type="text"
                          value={formData.contractorContact}
                          onChange={(e) => setFormData({ ...formData, contractorContact: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter contact number/email"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Department and Assigned To */}
              {/* Department and Assigned To - Only show for EO */}
              {user?.role === 'EO' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Department *
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {availableDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Assigned To
                    </label>
                    <select
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {availableUsers.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* File Upload */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Attachments
                </label>
                <div className="mt-1 flex justify-center px-4 pt-3 pb-4 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="flex text-xs text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 text-xs">
                        <span>Upload files</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xlsx,.xls"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 px-2">
                      PDF, Word, Excel, Images up to 5MB
                    </p>
                  </div>
                </div>
                
                {files && files.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600">Selected files:</p>
                    <ul className="text-xs text-gray-500">
                      {Array.from(files).map((file, index) => (
                        <li key={index}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors duration-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : isEditing ? `Update ${terminology}` : `Create ${terminology}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TicketForm;