import type { User } from './user.types';

export type ClarificationThreadStatus = 'OPEN' | 'RESOLVED' | 'COMPLETED' | 'CLOSED' | 'CANCELLED';

export type NotificationChannel = 'SMS' | 'EMAIL' | 'WHATSAPP';

export interface ClarificationAttachment {
  id: string;
  messageId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: Date;
  storagePath: string;
}

export interface ClarificationMessage {
  id: string;
  threadId: string;
  senderId: string;
  messageText: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  sender?: User;
  attachments?: ClarificationAttachment[];
}

export interface ClarificationThread {
  id: string;
  ticketId: string;
  stepId: string;
  createdBy: string;
  assignedTo: string;
  subject: string;
  status: ClarificationThreadStatus;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  completionNotes?: string;
  cancellationReason?: string;
  closureNotes?: string;
  actionTakenBy?: string;
  actionTakenAt?: Date;
  isRead?: boolean;
  readAt?: Date;
  messages?: ClarificationMessage[];
  creatorUser?: User;
  assignedUser?: User;
  unreadCount?: number;
  lastMessage?: string;
  messageCount?: number;
}

export interface NotificationPreference {
  selectedChannels: NotificationChannel[];
  demoMode: boolean;
}

export interface NotificationLog {
  id: string;
  threadId: string;
  messageId: string;
  recipientId: string;
  notificationChannels: NotificationChannel[];
  status: string;
  demoNote?: string;
  createdAt: Date;
}
