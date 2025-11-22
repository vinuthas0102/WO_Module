import { supabase, handleSupabaseError, isSupabaseAvailable } from '../lib/supabase';
import { User, Module } from '../types';
import { mockUsers } from '../data/mockData';
import { getAuthMode } from '../lib/environment';
import { isValidUUID, validateUUID } from '../lib/utils';

export class AuthService {
  static async login(usernameOrEmail: string, password: string): Promise<User | null> {
    // Check if we should use mock authentication
    if (getAuthMode() === 'mock') {
      return this.mockLogin(usernameOrEmail, password);
    }

    // If Supabase is not available, fallback to mock
    if (!isSupabaseAvailable()) {
      return this.mockLogin(usernameOrEmail, password);
    }

    try {
      // For demo purposes, validate credentials first
      const validCredentials = (
        (usernameOrEmail === 'admin' && password === 'admin') ||
        (usernameOrEmail === 'manager' && password === 'manager') ||
        (usernameOrEmail === 'user' && password === 'user') ||
        (usernameOrEmail === 'jane.doe' && password === 'password') ||
        (usernameOrEmail === 'hr.manager' && password === 'hrpass') ||
        (usernameOrEmail === 'do.it' && password === 'do.it') ||
        (usernameOrEmail === 'do.hr' && password === 'do.hr') ||
        (usernameOrEmail === 'do.finance' && password === 'do.finance') ||
        (usernameOrEmail === 'do.operations' && password === 'do.operations') ||
        (usernameOrEmail === 'do.maintenance' && password === 'do.maintenance') ||
        (usernameOrEmail === 'finance.officer' && password === 'finance123') ||
        (usernameOrEmail === 'abc.construction' && password === 'vendor123') ||
        (usernameOrEmail === 'xyz.suppliers' && password === 'vendor123') ||
        (usernameOrEmail === 'global.services' && password === 'vendor123') ||
        (usernameOrEmail === 'admin@company.com' && password === 'admin') ||
        (usernameOrEmail === 'manager@company.com' && password === 'manager') ||
        (usernameOrEmail === 'user@company.com' && password === 'user') ||
        (usernameOrEmail === 'jane@company.com' && password === 'password') ||
        (usernameOrEmail === 'hrmanager@company.com' && password === 'hrpass') ||
        (usernameOrEmail === 'do.it@company.com' && password === 'do.it') ||
        (usernameOrEmail === 'do.hr@company.com' && password === 'do.hr') ||
        (usernameOrEmail === 'do.finance@company.com' && password === 'do.finance') ||
        (usernameOrEmail === 'do.operations@company.com' && password === 'do.operations') ||
        (usernameOrEmail === 'do.maintenance@company.com' && password === 'do.maintenance') ||
        (usernameOrEmail === 'finance.officer@company.com' && password === 'finance123') ||
        (usernameOrEmail === 'abc.construction@vendor.com' && password === 'vendor123') ||
        (usernameOrEmail === 'xyz.suppliers@vendor.com' && password === 'vendor123') ||
        (usernameOrEmail === 'global.services@vendor.com' && password === 'vendor123')
      );

      if (!validCredentials) {
        return null;
      }

      // Try to get user from database first by email/username
      const dbUser = await this.getUserByEmailOrUsername(usernameOrEmail);

      if (dbUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('active, locked_until')
          .eq('id', dbUser.id)
          .maybeSingle();

        if (userData && !userData.active) {
          console.log('User account is disabled');
          return null;
        }

        if (userData?.locked_until && new Date(userData.locked_until) > new Date()) {
          console.log('User account is locked');
          return null;
        }

        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', dbUser.id);

        return {
          ...dbUser,
          lastLogin: new Date()
        };
      }

      // Fallback to mock user data if not in database
      const mockUser = mockUsers.find(u => u.username === usernameOrEmail || u.email === usernameOrEmail);
      if (!mockUser) {
        console.error('No user data found for:', usernameOrEmail);
        return null;
      }

      // Ensure user exists in database
      await this.ensureUserExistsInDatabase(mockUser);

      return {
        ...mockUser,
        lastLogin: new Date()
      };
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  private static async getUserByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    if (!isSupabaseAvailable()) {
      return null;
    }

    try {
      let data, error;

      if (emailOrUsername.includes('@')) {
        const result = await supabase
          ?.from('users')
          .select('*')
          .eq('email', emailOrUsername)
          .maybeSingle();
        data = result?.data;
        error = result?.error;
      } else {
        const result = await supabase
          ?.from('users')
          .select('*')
          .ilike('email', `${emailOrUsername}@%`)
          .limit(1);

        data = result?.data?.[0] || null;
        error = result?.error;
      }

      if (error || !data) {
        console.log('User lookup failed:', { emailOrUsername, error, hasData: !!data });
        return null;
      }

      return {
        id: data.id,
        username: data.email.split('@')[0],
        name: data.name,
        email: data.email,
        role: data.role === 'dept_officer' ? 'DO' : data.role === 'eo' ? 'EO' : data.role === 'employee' ? 'EMPLOYEE' : data.role === 'vendor' ? 'VENDOR' : data.role === 'finance' ? 'FINANCE' : data.role,
        department: data.department,
        lastLogin: data.last_login ? new Date(data.last_login) : undefined
      };
    } catch (error) {
      console.error('Error fetching user from database:', error);
      return null;
    }
  }

  private static async getUserFromDatabase(userId: string): Promise<User | null> {
    if (!isSupabaseAvailable()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        ?.from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        username: data.email.split('@')[0],
        name: data.name,
        email: data.email,
        role: data.role === 'dept_officer' ? 'DO' : data.role === 'eo' ? 'EO' : data.role === 'employee' ? 'EMPLOYEE' : data.role === 'vendor' ? 'VENDOR' : data.role === 'finance' ? 'FINANCE' : data.role,
        department: data.department,
        lastLogin: data.last_login ? new Date(data.last_login) : undefined
      };
    } catch (error) {
      console.error('Error fetching user from database:', error);
      return null;
    }
  }

  private static async ensureUserExistsInDatabase(mockUser: User): Promise<void> {
    if (!isSupabaseAvailable()) {
      return;
    }

    try {
      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        ?.from('users')
        .select('id')
        .eq('id', mockUser.id)
        .maybeSingle();

      // If user doesn't exist, create them
      if (fetchError?.code === 'PGRST116' || !existingUser) {
        console.log('Creating user in database:', mockUser.name);

        // Map application roles to database roles
        const roleMapping: Record<string, string> = {
          'DO': 'dept_officer',
          'EO': 'eo',
          'EMPLOYEE': 'employee',
          'VENDOR': 'vendor',
          'FINANCE': 'finance'
        };

        const dbRole = roleMapping[mockUser.role] || mockUser.role.toLowerCase();

        const { error: insertError } = await supabase
          ?.from('users')
          .insert({
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            role: dbRole,
            department: mockUser.department,
            active: true
          });

        if (insertError && insertError.code !== '23505') { // Ignore duplicate key errors
          console.error('Failed to create user in database:', insertError);
        }
      }
    } catch (error) {
      console.error('Error ensuring user exists in database:', error);
    }
  }

  private static mockLogin(usernameOrEmail: string, password: string): User | null {
    const validCredentials = (
      (usernameOrEmail === 'admin' && password === 'admin') ||
      (usernameOrEmail === 'manager' && password === 'manager') ||
      (usernameOrEmail === 'user' && password === 'user') ||
      (usernameOrEmail === 'jane.doe' && password === 'password') ||
      (usernameOrEmail === 'hr.manager' && password === 'hrpass') ||
      (usernameOrEmail === 'do.it' && password === 'do.it') ||
      (usernameOrEmail === 'do.hr' && password === 'do.hr') ||
      (usernameOrEmail === 'do.finance' && password === 'do.finance') ||
      (usernameOrEmail === 'do.operations' && password === 'do.operations') ||
      (usernameOrEmail === 'do.maintenance' && password === 'do.maintenance') ||
      (usernameOrEmail === 'abc.construction' && password === 'vendor123') ||
      (usernameOrEmail === 'xyz.suppliers' && password === 'vendor123') ||
      (usernameOrEmail === 'global.services' && password === 'vendor123') ||
      (usernameOrEmail === 'admin@company.com' && password === 'admin') ||
      (usernameOrEmail === 'manager@company.com' && password === 'manager') ||
      (usernameOrEmail === 'user@company.com' && password === 'user') ||
      (usernameOrEmail === 'jane@company.com' && password === 'password') ||
      (usernameOrEmail === 'hrmanager@company.com' && password === 'hrpass') ||
      (usernameOrEmail === 'do.it@company.com' && password === 'do.it') ||
      (usernameOrEmail === 'do.hr@company.com' && password === 'do.hr') ||
      (usernameOrEmail === 'do.finance@company.com' && password === 'do.finance') ||
      (usernameOrEmail === 'do.operations@company.com' && password === 'do.operations') ||
      (usernameOrEmail === 'do.maintenance@company.com' && password === 'do.maintenance') ||
      (usernameOrEmail === 'abc.construction@vendor.com' && password === 'vendor123') ||
      (usernameOrEmail === 'xyz.suppliers@vendor.com' && password === 'vendor123') ||
      (usernameOrEmail === 'global.services@vendor.com' && password === 'vendor123')
    );

    if (!validCredentials) {
      return null;
    }

    const user = mockUsers.find(u => u.username === usernameOrEmail || u.email === usernameOrEmail);
    if (user) {
      try {
        validateUUID(user.id, 'User ID');
      } catch (error) {
        console.error('Invalid mock user ID:', user.id);
        return null;
      }

      return {
        ...user,
        lastLogin: new Date()
      };
    }

    return null;
  }

  static async getAllUsers(): Promise<User[]> {
    // If Supabase is not available or configured, return mock users
    if (!isSupabaseAvailable()) {
      return mockUsers;
    }

    try {
      const { data: users, error } = await supabase
        ?.from('users')
        .select('*')
        .order('name');

      if (error) {
        console.warn('Supabase users query failed, falling back to mock data:', error);
        return mockUsers;
      }

      return users?.map(user => ({
        id: user.id,
        username: user.email.split('@')[0],
        name: user.name,
        email: user.email,
        role: user.role === 'dept_officer' ? 'DO' : user.role === 'eo' ? 'EO' : user.role === 'employee' ? 'EMPLOYEE' : user.role === 'vendor' ? 'VENDOR' : user.role === 'finance' ? 'FINANCE' : user.role,
        department: user.department,
        lastLogin: user.last_login ? new Date(user.last_login) : undefined
      }))
      .filter(user => {
        // Filter out users with invalid UUID format
        if (!isValidUUID(user.id)) {
          console.warn(`Filtering out user with invalid UUID: ${user.id} (${user.name})`);
          return false;
        }
        return true;
      }) || [];
    } catch (error) {
      console.warn('Supabase connection failed, using mock data:', error);
      return mockUsers;
    }
  }

  static async getAvailableModules(): Promise<Module[]> {
    // Mock modules for demo mode
    const mockModules: Module[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440101',
        name: 'Maintenance Tracker',
        description: 'Track and manage maintenance requests and work orders',
        icon: 'Wrench',
        color: 'from-blue-500 to-indigo-500',
        schema_id: 'maintenance',
        config: { categories: ['Electrical', 'Plumbing', 'HVAC', 'General Maintenance', 'Equipment Repair'] },
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440102',
        name: 'Complaints Tracker',
        description: 'Manage customer complaints and resolution workflows',
        icon: 'AlertTriangle',
        color: 'from-red-500 to-pink-500',
        schema_id: 'complaints',
        config: { categories: ['Service Quality', 'Staff Behavior', 'Facility Issues', 'Process Issues', 'Other'] },
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440103',
        name: 'Grievances Management',
        description: 'Handle employee grievances and HR processes',
        icon: 'Users',
        color: 'from-orange-500 to-red-500',
        schema_id: 'grievances',
        config: { categories: ['Workplace Issues', 'Policy Concerns', 'Discrimination', 'Safety Issues', 'Other'] },
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440104',
        name: 'RTI Tracker',
        description: 'Right to Information request tracking and management',
        icon: 'FileText',
        color: 'from-green-500 to-teal-500',
        schema_id: 'rti',
        config: { categories: ['Information Request', 'Appeal', 'Compliance', 'Documentation', 'Other'] },
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440105',
        name: 'Project Execution Platform',
        description: 'Track project milestones and deliverables',
        icon: 'Briefcase',
        color: 'from-purple-500 to-indigo-500',
        schema_id: 'pep',
        config: { categories: ['Planning', 'Execution', 'Monitoring', 'Resource Management', 'Quality Control'] },
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    console.log('Loading modules - total mock modules:', mockModules.length);
    console.log('Mock modules:', mockModules.map(m => ({ id: m.id, name: m.name })));

    // If Supabase is not available, return mock modules
    if (!isSupabaseAvailable()) {
      console.log('Supabase not available, returning mock modules');
      return mockModules;
    }

    try {
      const { data: modules, error } = await supabase
        ?.from('modules')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        console.warn('Supabase modules query failed, falling back to mock data:', error);
        return mockModules;
      }

      const dbModules = modules?.map(module => ({
        id: module.id,
        name: module.name,
        description: module.description || '',
        icon: module.icon || 'FileText',
        color: module.color || 'from-blue-500 to-indigo-500',
        schema_id: module.schema_id,
        config: {
          categories: Array.isArray(module.config?.categories) 
            ? module.config.categories 
            : ['General'],
          ...module.config
        },
        active: module.active || true,
        created_at: new Date(module.created_at),
        updated_at: new Date(module.updated_at)
      }))
      .filter(module => {
        // Filter out modules with invalid UUID format
        if (!isValidUUID(module.id)) {
          console.warn(`Filtering out module with invalid UUID: ${module.id} (${module.name})`);
          return false;
        }
        return true;
      });

      console.log('Database modules loaded:', dbModules?.length || 0);
      return dbModules && dbModules.length > 0 ? dbModules : mockModules;
    } catch (error) {
      console.warn('Supabase connection failed, using mock data:', error);
      return mockModules; // Fallback to mock data on error
    }
  }
}