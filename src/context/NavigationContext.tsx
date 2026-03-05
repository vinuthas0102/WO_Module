import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PendingNavigation {
  ticketId: string;
  threadId: string;
}

interface NavigationContextType {
  pendingNavigation: PendingNavigation | null;
  navigateToTicketChat: (ticketId: string, threadId: string) => void;
  clearPendingNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);

  const navigateToTicketChat = (ticketId: string, threadId: string) => {
    setPendingNavigation({ ticketId, threadId });
  };

  const clearPendingNavigation = () => {
    setPendingNavigation(null);
  };

  return (
    <NavigationContext.Provider value={{ pendingNavigation, navigateToTicketChat, clearPendingNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
};
