import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Ticket, TicketStatus, StatusTransitionRequest, WorkflowStep, User, Module, BulkStepInput, BulkOperationResult, BulkTicketInput, BulkTicketOperationResult } from '../types';
import { TicketService } from '../services/ticketService';
import { AuthService } from '../services/authService';
import { useAuth } from './AuthContext';

interface TicketContextType {
  tickets: Ticket[];
  users: User[];
  loading: boolean;
  error: string | null;
  bulkOperationInProgress: boolean;
  createTicket: (ticket: Omit<Ticket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'workflow' | 'attachments' | 'auditTrail'>, copiedFromTicketId?: string) => Promise<void>;
  createTicketsBulk: (tickets: BulkTicketInput[]) => Promise<BulkTicketOperationResult>;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  changeTicketStatus: (request: StatusTransitionRequest) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  getTicketById: (id: string) => Ticket | undefined;
  getFilteredTickets: (filters: TicketFilters) => Ticket[];
  addStep: (ticketId: string, step: Omit<WorkflowStep, 'id' | 'createdAt' | 'comments' | 'attachments'>) => Promise<void>;
  updateStep: (ticketId: string, stepId: string, updates: Partial<WorkflowStep>, remarks?: string) => Promise<void>;
  deleteStep: (ticketId: string, stepId: string) => Promise<void>;
  addStepsBulk: (ticketId: string, steps: BulkStepInput[], parentStepId?: string) => Promise<BulkOperationResult>;
}

interface TicketFilters {
  search?: string;
  status?: TicketStatus;
  assignedTo?: string;
  department?: string;
  priority?: string;
  createdBy?: string;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export const useTickets = () => {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
};

interface TicketProviderProps {
  children: ReactNode;
}

export const TicketProvider: React.FC<TicketProviderProps> = ({ children }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bulkOperationInProgress, setBulkOperationInProgress] = useState(false);
  const { user, selectedModule } = useAuth();

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('TicketContext: Loading data for user:', user?.id, 'role:', user?.role, 'module:', selectedModule?.id);

        const usersData = await AuthService.getAllUsers();
        setUsers(usersData);
        console.log('TicketContext: Loaded users:', usersData.length);

        if (selectedModule && user) {
          console.log('TicketContext: Fetching tickets for module:', selectedModule.name);
          const ticketsData = await TicketService.getTicketsByModule(
            selectedModule.id,
            user.id,
            user.role
          );
          console.log('TicketContext: Loaded tickets:', ticketsData.length);
          setTickets(ticketsData);
        } else {
          console.log('TicketContext: No module or user selected, clearing tickets');
          setTickets([]);
        }
      } catch (err) {
        console.error('TicketContext: Failed to load data:', {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          user: user?.id,
          role: user?.role,
          module: selectedModule?.id
        });

        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);

        // Try to load users as fallback to prevent completely blank screen
        if (users.length === 0) {
          try {
            const fallbackUsers = await AuthService.getAllUsers();
            setUsers(fallbackUsers);
            console.log('TicketContext: Loaded fallback users:', fallbackUsers.length);
          } catch (userErr) {
            console.error('TicketContext: Failed to load fallback users:', userErr);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, [selectedModule, user]);

  const createTicket = async (ticketData: Omit<Ticket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'workflow' | 'attachments' | 'auditTrail'>, copiedFromTicketId?: string): Promise<string> => {
    try {
      if (!selectedModule) {
        throw new Error('No module selected');
      }

      const ticketId = await TicketService.createTicket(ticketData, copiedFromTicketId);

      // Reload tickets to get the updated list
      if (user) {
        const updatedTickets = await TicketService.getTicketsByModule(
          selectedModule.id,
          user.id,
          user.role
        );
        setTickets(updatedTickets);
      }

      return ticketId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
      throw err;
    }
  };

  const createTicketsBulk = async (ticketsData: BulkTicketInput[]): Promise<BulkTicketOperationResult> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      if (!selectedModule) {
        throw new Error('No module selected');
      }

      setBulkOperationInProgress(true);

      const result = await TicketService.createTicketsBulk(
        ticketsData,
        selectedModule.id,
        user.id
      );

      if (user) {
        const updatedTickets = await TicketService.getTicketsByModule(
          selectedModule.id,
          user.id,
          user.role
        );
        setTickets(updatedTickets);
      }

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tickets in bulk');
      throw err;
    } finally {
      setBulkOperationInProgress(false);
    }
  };

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    try {
      if (!user) throw new Error('User not authenticated');
      if (!selectedModule) throw new Error('No module selected');
      
      await TicketService.updateTicket(id, updates, user.id);

      // Reload tickets to get the updated list
      const updatedTickets = await TicketService.getTicketsByModule(
        selectedModule.id,
        user.id,
        user.role
      );
      setTickets(updatedTickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ticket');
      throw err;
    }
  };

  const changeTicketStatus = async (request: StatusTransitionRequest) => {
    try {
      if (!user) throw new Error('User not authenticated');
      if (!selectedModule) throw new Error('No module selected');
      
      console.log('TicketContext.changeTicketStatus called:', request);
      
      await TicketService.changeTicketStatus(request, user.id);

      // Reload tickets to get the updated list
      const updatedTickets = await TicketService.getTicketsByModule(
        selectedModule.id,
        user.id,
        user.role
      );
      setTickets(updatedTickets);
      
      // Clear any previous errors
      setError(null);
      
      console.log('Status change completed successfully');
    } catch (err) {
      console.error('Status change error in context:', err);
      setError(err instanceof Error ? err.message : 'Failed to change status');
      throw err;
    }
  };

  const deleteTicket = async (id: string) => {
    try {
      if (!selectedModule) throw new Error('No module selected');

      await TicketService.deleteTicket(id);

      // Reload tickets to get the updated list
      if (user) {
        const updatedTickets = await TicketService.getTicketsByModule(
          selectedModule.id,
          user.id,
          user.role
        );
        setTickets(updatedTickets);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete ticket');
      throw err;
    }
  };

  const getTicketById = (id: string): Ticket | undefined => {
    return tickets.find(ticket => ticket.id === id);
  };

  const getFilteredTickets = (filters: TicketFilters): Ticket[] => {
    let filtered = tickets;

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.id.toLowerCase().includes(searchLower) ||
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(ticket => ticket.status === filters.status);
    }

    // Apply assignee filter
    if (filters.assignedTo) {
      filtered = filtered.filter(ticket => ticket.assignedTo === filters.assignedTo);
    }

    // Apply department filter
    if (filters.department) {
      filtered = filtered.filter(ticket => ticket.department === filters.department);
    }

    // Apply priority filter
    if (filters.priority) {
      filtered = filtered.filter(ticket => ticket.priority === filters.priority);
    }

    return filtered;
  };

  const addStep = async (ticketId: string, stepData: Omit<WorkflowStep, 'id' | 'createdAt' | 'comments' | 'attachments'>) => {
    try {
      if (!user) throw new Error('User not authenticated');
      if (!selectedModule) throw new Error('No module selected');

      console.log('TicketContext.addStep called with:', {
        ticketId,
        stepData,
        userId: user.id
      });

      const stepId = await TicketService.addStep(ticketId, stepData, user.id);

      // Reload tickets to get the updated list
      const updatedTickets = await TicketService.getTicketsByModule(
        selectedModule.id,
        user.id,
        user.role
      );
      setTickets(updatedTickets);

      console.log('Step added and tickets reloaded successfully');

      return stepId;
    } catch (err) {
      console.error('Error in TicketContext.addStep:', err);
      setError(err instanceof Error ? err.message : 'Failed to add step');
      throw err;
    }
  };

  const updateStep = async (ticketId: string, stepId: string, updates: Partial<WorkflowStep>, remarks?: string) => {
    try {
      if (!user) throw new Error('User not authenticated');
      if (!selectedModule) throw new Error('No module selected');

      await TicketService.updateStep(ticketId, stepId, updates, user.id, remarks);

      // Reload tickets to get the updated list
      const updatedTickets = await TicketService.getTicketsByModule(
        selectedModule.id,
        user.id,
        user.role
      );
      setTickets(updatedTickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update step');
      throw err;
    }
  };

  const deleteStep = async (ticketId: string, stepId: string) => {
    try {
      if (!user) throw new Error('User not authenticated');
      if (!selectedModule) throw new Error('No module selected');

      await TicketService.deleteStep(stepId, ticketId, user.id);

      // Reload tickets to get the updated list
      const updatedTickets = await TicketService.getTicketsByModule(
        selectedModule.id,
        user.id,
        user.role
      );
      setTickets(updatedTickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete step');
      throw err;
    }
  };

  const addStepsBulk = async (
    ticketId: string,
    steps: BulkStepInput[],
    parentStepId?: string
  ): Promise<BulkOperationResult> => {
    try {
      if (!user) throw new Error('User not authenticated');
      if (!selectedModule) throw new Error('No module selected');

      setBulkOperationInProgress(true);

      const result = await TicketService.addStepsBulk(ticketId, steps, user.id, parentStepId);

      const updatedTickets = await TicketService.getTicketsByModule(
        selectedModule.id,
        user.id,
        user.role
      );
      setTickets(updatedTickets);

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add steps in bulk');
      throw err;
    } finally {
      setBulkOperationInProgress(false);
    }
  };

  const value: TicketContextType = {
    tickets,
    users,
    loading,
    error,
    bulkOperationInProgress,
    createTicket,
    createTicketsBulk,
    updateTicket,
    changeTicketStatus,
    deleteTicket,
    getTicketById,
    getFilteredTickets,
    addStep,
    updateStep,
    deleteStep,
    addStepsBulk,
  };

  return (
    <TicketContext.Provider value={value}>
      {children}
    </TicketContext.Provider>
  );
};