import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Module, UserDisplayPreferences } from '../types';
import { AuthService } from '../services/authService';
import { TicketService } from '../services/ticketService';
import { UserPreferencesService } from '../services/userPreferencesService';
import { isValidUUID } from '../lib/utils';

interface AuthContextType {
  user: User | null;
  selectedModule: Module | null;
  availableModules: Module[];
  displayPreferences: UserDisplayPreferences | null;
  setSelectedModule: (module: Module | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  selectModule: (module: Module) => void;
  updateDisplayPreferences: (preferences: Partial<Omit<UserDisplayPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => Promise<boolean>;
  isAuthenticated: boolean;
  isModuleSelected: boolean;
  canAccessTicket: (ticketId: string) => Promise<boolean>;
  getAccessibleTicketIds: () => Promise<string[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [displayPreferences, setDisplayPreferences] = useState<UserDisplayPreferences | null>(null);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('user');
    const savedModule = localStorage.getItem('selectedModule');

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Convert lastLogin string back to Date object if it exists
        if (parsedUser.lastLogin) {
          parsedUser.lastLogin = new Date(parsedUser.lastLogin);
        }
        setUser(parsedUser);
        // Load user preferences
        loadUserPreferences(parsedUser.id);
      } catch (error) {
        localStorage.removeItem('user');
      }
    }

    if (savedModule) {
      try {
        const parsedModule = JSON.parse(savedModule);
        if (parsedModule.id && isValidUUID(parsedModule.id)) {
          setSelectedModule(parsedModule);
        } else {
          console.warn('Invalid module ID found in localStorage:', parsedModule.id);
          localStorage.removeItem('selectedModule');
          setSelectedModule(null);
        }
      } catch (error) {
        localStorage.removeItem('selectedModule');
      }
    }

    // Load available modules
    loadModules();
  }, []);

  const loadUserPreferences = async (userId: string) => {
    try {
      let prefs = await UserPreferencesService.getUserPreferences(userId);

      if (!prefs) {
        console.log('No user preferences found, initializing defaults for user:', userId);
        prefs = await UserPreferencesService.initializeDefaultPreferences(userId);
      }

      if (prefs) {
        setDisplayPreferences(prefs);
      } else {
        console.warn('Failed to initialize preferences, using in-memory defaults');
        setDisplayPreferences(UserPreferencesService.getDefaultPreferences());
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      setDisplayPreferences(UserPreferencesService.getDefaultPreferences());
    }
  };

  const loadModules = async () => {
    try {
      console.log('AuthContext: Loading modules...');
      const modules = await AuthService.getAvailableModules();
      console.log('AuthContext: Loaded modules:', modules.length, modules.map(m => m.name));
      setAvailableModules(modules);
    } catch (error) {
      console.error('Failed to load modules:', error);
      // Set empty array to prevent infinite loading
      setAvailableModules([]);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const authenticatedUser = await AuthService.login(email, password);

      if (authenticatedUser) {
        setUser(authenticatedUser);
        localStorage.setItem('user', JSON.stringify(authenticatedUser));
        // Load user preferences after successful login
        await loadUserPreferences(authenticatedUser.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const selectModule = (module: Module) => {
    console.log('Selecting module:', module);
    console.log('Module categories:', module.config?.categories);
    setSelectedModule(module);
    localStorage.setItem('selectedModule', JSON.stringify(module));
  };

  const logout = () => {
    setUser(null);
    setSelectedModule(null);
    setDisplayPreferences(null);
    localStorage.removeItem('user');
    localStorage.removeItem('selectedModule');
    UserPreferencesService.clearCache();
  };

  const updateDisplayPreferences = async (
    preferences: Partial<Omit<UserDisplayPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const result = await UserPreferencesService.saveUserPreferences(user.id, preferences);

      if (result.success && result.data) {
        setDisplayPreferences(result.data);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to update display preferences:', error);
      return false;
    }
  };

  const canAccessTicket = async (ticketId: string): Promise<boolean> => {
    if (!user) return false;
    if (user.role === 'EO') return true;

    return await TicketService.canUserAccessTicket(user.id, ticketId);
  };

  const getAccessibleTicketIds = async (): Promise<string[]> => {
    if (!user) return [];
    if (user.role === 'EO') return [];

    return await TicketService.getAccessibleTicketIds(user.id);
  };

  const value: AuthContextType = {
    user,
    selectedModule,
    availableModules,
    displayPreferences,
    setSelectedModule,
    login,
    logout,
    selectModule,
    updateDisplayPreferences,
    isAuthenticated: !!user,
    isModuleSelected: !!selectedModule,
    canAccessTicket,
    getAccessibleTicketIds
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};