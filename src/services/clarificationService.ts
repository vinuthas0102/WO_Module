import { supabase } from '../lib/supabase';
import {
  ClarificationThread,
  ClarificationMessage,
  ClarificationAttachment,
  ClarificationThreadStatus,
  NotificationChannel,
  User
} from '../types';

export class ClarificationService {
  static async createThread(params: {
    ticketId: string;
    stepId: string;
    subject: string;
    initialMessage: string;
    createdBy: string;
    assignedTo: string;
    attachmentFile?: File;
    notificationChannels?: NotificationChannel[];
  }): Promise<ClarificationThread> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data: threadData, error: threadError } = await supabase
        .from('clarification_threads')
        .insert({
          ticket_id: params.ticketId,
          step_id: params.stepId,
          subject: params.subject,
          created_by: params.createdBy,
          assigned_to: params.assignedTo,
          status: 'OPEN'
        })
        .select()
        .single();

      if (threadError) throw threadError;

      const { data: messageData, error: messageError } = await supabase
        .from('clarification_messages')
        .insert({
          thread_id: threadData.id,
          sender_id: params.createdBy,
          message_text: params.initialMessage
        })
        .select()
        .single();

      if (messageError) throw messageError;

      if (params.attachmentFile) {
        await this.uploadAttachment(params.attachmentFile, threadData.id, messageData.id, params.createdBy);
      }

      if (params.notificationChannels && params.notificationChannels.length > 0) {
        await supabase
          .from('clarification_notification_log')
          .insert({
            thread_id: threadData.id,
            message_id: messageData.id,
            recipient_id: params.assignedTo,
            notification_channels: params.notificationChannels,
            status: 'DEMO_MODE'
          });

        console.log('🔔 DEMO NOTIFICATION - Would send via:', params.notificationChannels.join(', '));
        console.log('📧 Recipient:', params.assignedTo);
        console.log('💬 Subject:', params.subject);
        console.log('📝 Message:', params.initialMessage);
      }

      return this.mapThreadFromDb(threadData);
    } catch (error) {
      console.error('Error creating clarification thread:', error);
      throw error;
    }
  }

  static async getThreadsByTicket(ticketId: string): Promise<ClarificationThread[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data, error } = await supabase
        .from('clarification_threads')
        .select(`
          *,
          creator:users!clarification_threads_created_by_fkey(id, name, email, role),
          assigned:users!clarification_threads_assigned_to_fkey(id, name, email, role)
        `)
        .eq('ticket_id', ticketId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const threadsWithCounts = await Promise.all(
        (data || []).map(async (thread) => {
          const { count } = await supabase
            .from('clarification_messages')
            .select('*', { count: 'exact', head: true })
            .eq('thread_id', thread.id);

          const { data: lastMessage } = await supabase
            .from('clarification_messages')
            .select('message_text')
            .eq('thread_id', thread.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...this.mapThreadFromDb(thread),
            messageCount: count || 0,
            lastMessage: lastMessage?.message_text || '',
            creatorUser: thread.creator as any,
            assignedUser: thread.assigned as any
          };
        })
      );

      return threadsWithCounts;
    } catch (error) {
      console.error('Error fetching threads by ticket:', error);
      throw error;
    }
  }

  static async getThreadsByStep(ticketId: string, stepId: string): Promise<ClarificationThread[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data, error } = await supabase
        .from('clarification_threads')
        .select(`
          *,
          creator:users!clarification_threads_created_by_fkey(id, name, email, role),
          assigned:users!clarification_threads_assigned_to_fkey(id, name, email, role)
        `)
        .eq('ticket_id', ticketId)
        .eq('step_id', stepId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(thread => ({
        ...this.mapThreadFromDb(thread),
        creatorUser: thread.creator as any,
        assignedUser: thread.assigned as any
      }));
    } catch (error) {
      console.error('Error fetching threads by step:', error);
      throw error;
    }
  }

  static async getThreadById(threadId: string): Promise<ClarificationThread | null> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data, error } = await supabase
        .from('clarification_threads')
        .select(`
          *,
          creator:users!clarification_threads_created_by_fkey(id, name, email, role),
          assigned:users!clarification_threads_assigned_to_fkey(id, name, email, role)
        `)
        .eq('id', threadId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        ...this.mapThreadFromDb(data),
        creatorUser: data.creator as any,
        assignedUser: data.assigned as any
      };
    } catch (error) {
      console.error('Error fetching thread by id:', error);
      return null;
    }
  }

  static async getThreadMessages(threadId: string): Promise<ClarificationMessage[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data: messages, error: messagesError } = await supabase
        .from('clarification_messages')
        .select(`
          *,
          sender:users!clarification_messages_sender_id_fkey(id, name, email, role)
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      const messagesWithAttachments = await Promise.all(
        (messages || []).map(async (msg) => {
          const { data: attachments } = await supabase
            .from('clarification_attachments')
            .select('*')
            .eq('message_id', msg.id);

          return {
            ...this.mapMessageFromDb(msg),
            sender: msg.sender as any,
            attachments: (attachments || []).map(att => this.mapAttachmentFromDb(att))
          };
        })
      );

      return messagesWithAttachments;
    } catch (error) {
      console.error('Error fetching thread messages:', error);
      throw error;
    }
  }

  static async sendMessage(params: {
    threadId: string;
    senderId: string;
    messageText: string;
    attachmentFiles?: File[];
    notificationChannels?: NotificationChannel[];
    recipientId?: string;
  }): Promise<ClarificationMessage> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data: messageData, error: messageError } = await supabase
        .from('clarification_messages')
        .insert({
          thread_id: params.threadId,
          sender_id: params.senderId,
          message_text: params.messageText
        })
        .select()
        .single();

      if (messageError) throw messageError;

      if (params.attachmentFiles && params.attachmentFiles.length > 0) {
        for (const file of params.attachmentFiles) {
          await this.uploadAttachment(file, params.threadId, messageData.id, params.senderId);
        }
      }

      if (params.notificationChannels && params.notificationChannels.length > 0 && params.recipientId) {
        await supabase
          .from('clarification_notification_log')
          .insert({
            thread_id: params.threadId,
            message_id: messageData.id,
            recipient_id: params.recipientId,
            notification_channels: params.notificationChannels,
            status: 'DEMO_MODE'
          });

        console.log('🔔 DEMO NOTIFICATION - Would send via:', params.notificationChannels.join(', '));
        console.log('📧 Recipient:', params.recipientId);
        console.log('💬 Message:', params.messageText);
      }

      return this.mapMessageFromDb(messageData);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static async updateThreadStatus(
    threadId: string,
    newStatus: ClarificationThreadStatus,
    userId: string
  ): Promise<void> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const updateData: any = {
        status: newStatus
      };

      if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = userId;
      }

      const { error } = await supabase
        .from('clarification_threads')
        .update(updateData)
        .eq('id', threadId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating thread status:', error);
      throw error;
    }
  }

  static async uploadAttachment(
    file: File,
    threadId: string,
    messageId: string,
    uploadedBy: string
  ): Promise<ClarificationAttachment> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      if (file.size > 5242880) {
        throw new Error('File size exceeds 5MB limit');
      }

      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${threadId}/${messageId}/${timestamp}-${sanitizedFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('clarification-attachments')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: attachmentData, error: attachmentError } = await supabase
        .from('clarification_attachments')
        .insert({
          message_id: messageId,
          file_name: file.name,
          file_path: storagePath,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: uploadedBy,
          storage_path: storagePath
        })
        .select()
        .single();

      if (attachmentError) throw attachmentError;

      return this.mapAttachmentFromDb(attachmentData);
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  }

  static async getAttachmentUrl(attachmentId: string): Promise<string> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data: attachment, error: fetchError } = await supabase
        .from('clarification_attachments')
        .select('storage_path')
        .eq('id', attachmentId)
        .single();

      if (fetchError) throw fetchError;

      const { data: urlData } = await supabase.storage
        .from('clarification-attachments')
        .createSignedUrl(attachment.storage_path, 3600);

      if (!urlData?.signedUrl) {
        throw new Error('Failed to generate signed URL');
      }

      return urlData.signedUrl;
    } catch (error) {
      console.error('Error getting attachment URL:', error);
      throw error;
    }
  }

  static async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { error } = await supabase
        .from('clarification_messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  private static mapThreadFromDb(data: any): ClarificationThread {
    return {
      id: data.id,
      ticketId: data.ticket_id,
      stepId: data.step_id,
      createdBy: data.created_by,
      assignedTo: data.assigned_to,
      subject: data.subject,
      status: data.status as ClarificationThreadStatus,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined,
      resolvedBy: data.resolved_by
    };
  }

  private static mapMessageFromDb(data: any): ClarificationMessage {
    return {
      id: data.id,
      threadId: data.thread_id,
      senderId: data.sender_id,
      messageText: data.message_text,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      isDeleted: data.is_deleted || false,
      deletedAt: data.deleted_at ? new Date(data.deleted_at) : undefined
    };
  }

  private static mapAttachmentFromDb(data: any): ClarificationAttachment {
    return {
      id: data.id,
      messageId: data.message_id,
      fileName: data.file_name,
      filePath: data.file_path,
      fileSize: data.file_size,
      fileType: data.file_type,
      uploadedBy: data.uploaded_by,
      uploadedAt: new Date(data.uploaded_at),
      storagePath: data.storage_path
    };
  }
}
