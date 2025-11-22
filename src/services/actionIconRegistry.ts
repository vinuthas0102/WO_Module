import {
  Edit, Trash2, Eye, CheckCircle, XCircle, RotateCcw, Play,
  Plus, Upload, Download, FileText, Users, Share2, Archive,
  Clock, AlertTriangle, Check, X, Power, PowerOff, Key, Copy,
  Send, Printer, Save, RefreshCw, Settings, Filter, Search, IndianRupee
} from 'lucide-react';
import { ActionRegistryEntry, ActionCategory } from '../types';

export const ACTION_CATEGORIES: ActionCategory[] = [
  { id: 'view', label: 'View Actions', order: 1, color: 'text-blue-600' },
  { id: 'edit', label: 'Edit Actions', order: 2, color: 'text-green-600' },
  { id: 'status', label: 'Status Actions', order: 3, color: 'text-orange-600' },
  { id: 'document', label: 'Document Actions', order: 4, color: 'text-purple-600' },
  { id: 'admin', label: 'Admin Actions', order: 5, color: 'text-red-600' },
  { id: 'general', label: 'General Actions', order: 6, color: 'text-gray-600' }
];

export const ACTION_REGISTRY: Record<string, ActionRegistryEntry> = {
  view: {
    id: 'view',
    icon: Eye,
    label: 'View Details',
    category: 'view',
    requiredRoles: ['EMPLOYEE', 'DO', 'EO', 'VENDOR'],
    color: 'text-blue-600',
    tooltip: 'View full details'
  },
  edit: {
    id: 'edit',
    icon: Edit,
    label: 'Edit',
    category: 'edit',
    requiredRoles: ['DO', 'EO'],
    color: 'text-green-600',
    tooltip: 'Edit this item'
  },
  modify: {
    id: 'modify',
    icon: Edit,
    label: 'Modify',
    category: 'edit',
    requiredRoles: ['DO', 'EO'],
    color: 'text-blue-600',
    tooltip: 'Modify details'
  },
  delete: {
    id: 'delete',
    icon: Trash2,
    label: 'Delete',
    category: 'admin',
    requiredRoles: ['EO'],
    color: 'text-red-600',
    tooltip: 'Delete this item'
  },
  approve: {
    id: 'approve',
    icon: Check,
    label: 'Approve',
    category: 'status',
    requiredRoles: ['DO', 'EO'],
    color: 'text-green-600',
    tooltip: 'Approve this request'
  },
  reject: {
    id: 'reject',
    icon: X,
    label: 'Reject',
    category: 'status',
    requiredRoles: ['DO', 'EO'],
    color: 'text-red-600',
    tooltip: 'Reject this request'
  },
  close: {
    id: 'close',
    icon: CheckCircle,
    label: 'Close',
    category: 'status',
    requiredRoles: ['DO', 'EO'],
    color: 'text-gray-600',
    tooltip: 'Close and complete'
  },
  cancel: {
    id: 'cancel',
    icon: XCircle,
    label: 'Cancel',
    category: 'status',
    requiredRoles: ['DO', 'EO'],
    color: 'text-red-600',
    tooltip: 'Cancel this action'
  },
  reopen: {
    id: 'reopen',
    icon: RotateCcw,
    label: 'Reopen',
    category: 'status',
    requiredRoles: ['DO', 'EO'],
    color: 'text-blue-600',
    tooltip: 'Reopen this item'
  },
  reinstate: {
    id: 'reinstate',
    icon: RotateCcw,
    label: 'Reinstate',
    category: 'status',
    requiredRoles: ['DO', 'EO'],
    color: 'text-orange-600',
    tooltip: 'Reinstate this item'
  },
  markInProgress: {
    id: 'markInProgress',
    icon: Play,
    label: 'Mark In Progress',
    category: 'status',
    requiredRoles: ['DO', 'EO'],
    color: 'text-orange-600',
    tooltip: 'Start working on this'
  },
  add: {
    id: 'add',
    icon: Plus,
    label: 'Add New',
    category: 'edit',
    requiredRoles: ['DO', 'EO'],
    color: 'text-green-600',
    tooltip: 'Add new item'
  },
  upload: {
    id: 'upload',
    icon: Upload,
    label: 'Upload',
    category: 'document',
    requiredRoles: ['EMPLOYEE', 'DO', 'EO', 'VENDOR'],
    color: 'text-purple-600',
    tooltip: 'Upload files'
  },
  download: {
    id: 'download',
    icon: Download,
    label: 'Download',
    category: 'document',
    requiredRoles: ['EMPLOYEE', 'DO', 'EO', 'VENDOR'],
    color: 'text-blue-600',
    tooltip: 'Download file'
  },
  viewDocument: {
    id: 'viewDocument',
    icon: FileText,
    label: 'View Document',
    category: 'document',
    requiredRoles: ['EMPLOYEE', 'DO', 'EO', 'VENDOR'],
    color: 'text-blue-600',
    tooltip: 'View document'
  },
  assign: {
    id: 'assign',
    icon: Users,
    label: 'Assign',
    category: 'edit',
    requiredRoles: ['DO', 'EO'],
    color: 'text-blue-600',
    tooltip: 'Assign to user'
  },
  share: {
    id: 'share',
    icon: Share2,
    label: 'Share',
    category: 'general',
    requiredRoles: ['EMPLOYEE', 'DO', 'EO', 'VENDOR'],
    color: 'text-blue-600',
    tooltip: 'Share with others'
  },
  archive: {
    id: 'archive',
    icon: Archive,
    label: 'Archive',
    category: 'admin',
    requiredRoles: ['EO'],
    color: 'text-gray-600',
    tooltip: 'Move to archive'
  },
  copy: {
    id: 'copy',
    icon: Copy,
    label: 'Copy',
    category: 'edit',
    requiredRoles: ['DO', 'EO'],
    color: 'text-blue-600',
    tooltip: 'Create a copy'
  },
  enable: {
    id: 'enable',
    icon: Power,
    label: 'Enable',
    category: 'admin',
    requiredRoles: ['EO'],
    color: 'text-green-600',
    tooltip: 'Enable this user'
  },
  disable: {
    id: 'disable',
    icon: PowerOff,
    label: 'Disable',
    category: 'admin',
    requiredRoles: ['EO'],
    color: 'text-yellow-600',
    tooltip: 'Disable this user'
  },
  resetPassword: {
    id: 'resetPassword',
    icon: Key,
    label: 'Reset Password',
    category: 'admin',
    requiredRoles: ['EO'],
    color: 'text-orange-600',
    tooltip: 'Reset user password'
  },
  send: {
    id: 'send',
    icon: Send,
    label: 'Send',
    category: 'general',
    requiredRoles: ['EMPLOYEE', 'DO', 'EO', 'VENDOR'],
    color: 'text-blue-600',
    tooltip: 'Send notification'
  },
  print: {
    id: 'print',
    icon: Printer,
    label: 'Print',
    category: 'general',
    requiredRoles: ['EMPLOYEE', 'DO', 'EO', 'VENDOR'],
    color: 'text-gray-600',
    tooltip: 'Print this page'
  },
  save: {
    id: 'save',
    icon: Save,
    label: 'Save',
    category: 'edit',
    requiredRoles: ['EMPLOYEE', 'DO', 'EO', 'VENDOR'],
    color: 'text-green-600',
    tooltip: 'Save changes'
  },
  refresh: {
    id: 'refresh',
    icon: RefreshCw,
    label: 'Refresh',
    category: 'general',
    requiredRoles: ['EMPLOYEE', 'DO', 'EO', 'VENDOR'],
    color: 'text-blue-600',
    tooltip: 'Refresh data'
  },
  settings: {
    id: 'settings',
    icon: Settings,
    label: 'Settings',
    category: 'admin',
    requiredRoles: ['EO'],
    color: 'text-gray-600',
    tooltip: 'Configure settings'
  },
  filter: {
    id: 'filter',
    icon: Filter,
    label: 'Filter',
    category: 'general',
    requiredRoles: ['EMPLOYEE', 'DO', 'EO', 'VENDOR'],
    color: 'text-blue-600',
    tooltip: 'Apply filters'
  },
  search: {
    id: 'search',
    icon: Search,
    label: 'Search',
    category: 'general',
    requiredRoles: ['EMPLOYEE', 'DO', 'EO', 'VENDOR'],
    color: 'text-blue-600',
    tooltip: 'Search items'
  },
  sendToFinance: {
    id: 'sendToFinance',
    icon: IndianRupee,
    label: 'Send to Finance',
    category: 'status',
    requiredRoles: ['DO', 'EO'],
    color: 'text-green-600',
    tooltip: 'Submit to Finance Department for cost approval'
  }
};

export class ActionIconRegistry {
  static getAction(actionId: string): ActionRegistryEntry | undefined {
    return ACTION_REGISTRY[actionId];
  }

  static getAllActions(): ActionRegistryEntry[] {
    return Object.values(ACTION_REGISTRY);
  }

  static getActionsByCategory(categoryId: string): ActionRegistryEntry[] {
    return this.getAllActions().filter(action => action.category === categoryId);
  }

  static filterActionsByRole(actions: ActionRegistryEntry[], userRole: string): ActionRegistryEntry[] {
    return actions.filter(action => {
      if (!action.requiredRoles || action.requiredRoles.length === 0) {
        return true;
      }
      return action.requiredRoles.includes(userRole as any);
    });
  }

  static getCategories(): ActionCategory[] {
    return ACTION_CATEGORIES;
  }

  static getCategoryById(categoryId: string): ActionCategory | undefined {
    return ACTION_CATEGORIES.find(cat => cat.id === categoryId);
  }
}
