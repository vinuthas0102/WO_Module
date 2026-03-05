import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { ClarificationService } from '../services/clarificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  unreadThreadIds: Set<string>;
  markThreadAsRead: (threadId: string) => Promise<void>;
  refreshUnread: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

const POLL_INTERVAL_MS = 20000;

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [unreadThreadIds, setUnreadThreadIds] = useState<Set<string>>(new Set());
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subscriptionRef = useRef<any>(null);

  const fetchUnread = async (userId: string) => {
    const ids = await ClarificationService.getUnreadThreadIds(userId);
    setUnreadThreadIds(new Set(ids));
  };

  const refreshUnread = async () => {
    if (user) await fetchUnread(user.id);
  };

  const markThreadAsRead = async (threadId: string) => {
    if (!user) return;
    await ClarificationService.markThreadAsRead(threadId, user.id);
    setUnreadThreadIds(prev => {
      const next = new Set(prev);
      next.delete(threadId);
      return next;
    });
  };

  useEffect(() => {
    if (!user) {
      setUnreadThreadIds(new Set());
      return;
    }

    fetchUnread(user.id);

    pollTimerRef.current = setInterval(() => {
      fetchUnread(user.id);
    }, POLL_INTERVAL_MS);

    if (supabase) {
      subscriptionRef.current = supabase
        .channel('chat-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'clarification_threads',
            filter: `assigned_to=eq.${user.id}`
          },
          (payload) => {
            if (payload.new && !payload.new.is_read) {
              setUnreadThreadIds(prev => new Set([...prev, payload.new.id]));
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'clarification_threads',
            filter: `assigned_to=eq.${user.id}`
          },
          (payload) => {
            if (payload.new) {
              setUnreadThreadIds(prev => {
                const next = new Set(prev);
                if (payload.new.is_read) {
                  next.delete(payload.new.id);
                } else if (payload.new.status === 'OPEN') {
                  next.add(payload.new.id);
                }
                return next;
              });
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      if (subscriptionRef.current && supabase) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user?.id]);

  const value: NotificationContextType = {
    unreadCount: unreadThreadIds.size,
    unreadThreadIds,
    markThreadAsRead,
    refreshUnread
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
