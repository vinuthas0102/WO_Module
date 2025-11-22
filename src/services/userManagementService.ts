import { supabase, handleSupabaseError, isSupabaseAvailable } from '../lib/supabase';
import { User } from '../types';

export interface CreateUserRequest {
  name: string;
  email: string;
  role: 'employee' | 'dept_officer' | 'eo' | 'vendor' | 'finance';
  department: string;
  avatar?: string;
  createdBy: string;
}

export interface UpdateUserRequest {
  id: string;
  name?: string;
  email?: string;
  role?: 'employee' | 'dept_officer' | 'eo' | 'vendor' | 'finance';
  department?: string;
  avatar?: string;
  updatedBy: string;
}

export interface UserManagementResponse {
  success: boolean;
  message: string;
  user?: User;
  tempPassword?: string;
}

export interface UserListFilters {
  search?: string;
  role?: string;
  department?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
}

export interface UserActivityLog {
  id: string;
  userId: string;
  activityType: 'login' | 'logout' | 'failed_login' | 'password_change' | 'account_locked' | 'account_unlocked';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface UserManagementAudit {
  id: string;
  targetUserId: string;
  performedBy: string;
  performedByName?: string;
  action: 'user_created' | 'user_updated' | 'user_deleted' | 'user_enabled' | 'user_disabled' | 'role_changed' | 'password_reset';
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  remarks?: string;
  createdAt: Date;
}

export class UserManagementService {
  private static generateSecurePassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';

    const allChars = uppercase + lowercase + numbers + symbols;
    let password = '';

    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  static async createUser(request: CreateUserRequest): Promise<UserManagementResponse> {
    if (!isSupabaseAvailable()) {
      return {
        success: false,
        message: 'Database connection not available'
      };
    }

    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', request.email)
        .maybeSingle();

      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists'
        };
      }

      const tempPassword = this.generateSecurePassword();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          name: request.name,
          email: request.email,
          role: request.role,
          department: request.department,
          avatar: request.avatar,
          active: true,
          temp_password: tempPassword,
          temp_password_expires_at: expiresAt.toISOString(),
          created_by: request.createdBy,
          updated_by: request.createdBy
        })
        .select()
        .single();

      if (insertError) {
        return {
          success: false,
          message: `Failed to create user: ${insertError.message}`
        };
      }

      await supabase.rpc('log_user_management_action', {
        p_target_user_id: newUser.id,
        p_performed_by: request.createdBy,
        p_action: 'user_created',
        p_new_values: {
          name: request.name,
          email: request.email,
          role: request.role,
          department: request.department
        }
      });

      const user: User = {
        id: newUser.id,
        username: newUser.email.split('@')[0],
        name: newUser.name,
        email: newUser.email,
        role: this.mapDatabaseRoleToAppRole(newUser.role),
        department: newUser.department,
        lastLogin: newUser.last_login ? new Date(newUser.last_login) : undefined
      };

      return {
        success: true,
        message: 'User created successfully',
        user,
        tempPassword
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while creating user'
      };
    }
  }

  static async updateUser(request: UpdateUserRequest): Promise<UserManagementResponse> {
    if (!isSupabaseAvailable()) {
      return {
        success: false,
        message: 'Database connection not available'
      };
    }

    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', request.id)
        .maybeSingle();

      if (!existingUser) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      const updateData: any = {
        updated_by: request.updatedBy,
        updated_at: new Date().toISOString()
      };

      if (request.name !== undefined) updateData.name = request.name;
      if (request.email !== undefined) updateData.email = request.email;
      if (request.role !== undefined) updateData.role = request.role;
      if (request.department !== undefined) updateData.department = request.department;
      if (request.avatar !== undefined) updateData.avatar = request.avatar;

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', request.id)
        .select()
        .single();

      if (updateError) {
        return {
          success: false,
          message: `Failed to update user: ${updateError.message}`
        };
      }

      const oldValues: Record<string, any> = {};
      const newValues: Record<string, any> = {};

      if (request.name && request.name !== existingUser.name) {
        oldValues.name = existingUser.name;
        newValues.name = request.name;
      }
      if (request.email && request.email !== existingUser.email) {
        oldValues.email = existingUser.email;
        newValues.email = request.email;
      }
      if (request.role && request.role !== existingUser.role) {
        oldValues.role = existingUser.role;
        newValues.role = request.role;
      }
      if (request.department && request.department !== existingUser.department) {
        oldValues.department = existingUser.department;
        newValues.department = request.department;
      }

      if (Object.keys(newValues).length > 0) {
        await supabase.rpc('log_user_management_action', {
          p_target_user_id: request.id,
          p_performed_by: request.updatedBy,
          p_action: 'user_updated',
          p_old_values: oldValues,
          p_new_values: newValues
        });
      }

      const user: User = {
        id: updatedUser.id,
        username: updatedUser.email.split('@')[0],
        name: updatedUser.name,
        email: updatedUser.email,
        role: this.mapDatabaseRoleToAppRole(updatedUser.role),
        department: updatedUser.department,
        lastLogin: updatedUser.last_login ? new Date(updatedUser.last_login) : undefined
      };

      return {
        success: true,
        message: 'User updated successfully',
        user
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while updating user'
      };
    }
  }

  static async deleteUser(userId: string, performedBy: string): Promise<UserManagementResponse> {
    if (!isSupabaseAvailable()) {
      return {
        success: false,
        message: 'Database connection not available'
      };
    }

    try {
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      const { error: deleteError } = await supabase
        .from('users')
        .update({
          active: false,
          updated_by: performedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (deleteError) {
        return {
          success: false,
          message: `Failed to delete user: ${deleteError.message}`
        };
      }

      await supabase.rpc('log_user_management_action', {
        p_target_user_id: userId,
        p_performed_by: performedBy,
        p_action: 'user_deleted',
        p_old_values: { active: true },
        p_new_values: { active: false },
        p_remarks: 'User soft deleted'
      });

      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while deleting user'
      };
    }
  }

  static async enableUser(userId: string, performedBy: string): Promise<UserManagementResponse> {
    return this.toggleUserStatus(userId, performedBy, true);
  }

  static async disableUser(userId: string, performedBy: string): Promise<UserManagementResponse> {
    return this.toggleUserStatus(userId, performedBy, false);
  }

  private static async toggleUserStatus(userId: string, performedBy: string, active: boolean): Promise<UserManagementResponse> {
    if (!isSupabaseAvailable()) {
      return {
        success: false,
        message: 'Database connection not available'
      };
    }

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          active,
          updated_by: performedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        return {
          success: false,
          message: `Failed to ${active ? 'enable' : 'disable'} user: ${updateError.message}`
        };
      }

      await supabase.rpc('log_user_management_action', {
        p_target_user_id: userId,
        p_performed_by: performedBy,
        p_action: active ? 'user_enabled' : 'user_disabled',
        p_old_values: { active: !active },
        p_new_values: { active }
      });

      return {
        success: true,
        message: `User ${active ? 'enabled' : 'disabled'} successfully`
      };
    } catch (error) {
      console.error(`Error ${active ? 'enabling' : 'disabling'} user:`, error);
      return {
        success: false,
        message: `An unexpected error occurred while ${active ? 'enabling' : 'disabling'} user`
      };
    }
  }

  static async getAllUsers(filters?: UserListFilters): Promise<User[]> {
    if (!isSupabaseAvailable()) {
      return [];
    }

    try {
      let query = supabase
        .from('users')
        .select('*')
        .order('name');

      if (filters?.role) {
        query = query.eq('role', filters.role);
      }

      if (filters?.department) {
        query = query.eq('department', filters.department);
      }

      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data: users, error } = await query;

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      return users?.map(user => ({
        id: user.id,
        username: user.email.split('@')[0],
        name: user.name,
        email: user.email,
        role: this.mapDatabaseRoleToAppRole(user.role),
        department: user.department,
        lastLogin: user.last_login ? new Date(user.last_login) : undefined
      })) || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  static async getUserById(userId: string): Promise<User | null> {
    if (!isSupabaseAvailable()) {
      return null;
    }

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !user) {
        return null;
      }

      return {
        id: user.id,
        username: user.email.split('@')[0],
        name: user.name,
        email: user.email,
        role: this.mapDatabaseRoleToAppRole(user.role),
        department: user.department,
        lastLogin: user.last_login ? new Date(user.last_login) : undefined
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  static async getUserActivityLogs(userId: string, limit: number = 50): Promise<UserActivityLog[]> {
    if (!isSupabaseAvailable()) {
      return [];
    }

    try {
      const { data: logs, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching activity logs:', error);
        return [];
      }

      return logs?.map(log => ({
        id: log.id,
        userId: log.user_id,
        activityType: log.activity_type,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        metadata: log.metadata,
        createdAt: new Date(log.created_at)
      })) || [];
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return [];
    }
  }

  static async getUserManagementAudit(userId?: string, limit: number = 100): Promise<UserManagementAudit[]> {
    if (!isSupabaseAvailable()) {
      return [];
    }

    try {
      let query = supabase
        .from('user_management_audit')
        .select(`
          *,
          performed_by_user:users!user_management_audit_performed_by_fkey(name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('target_user_id', userId);
      }

      const { data: audits, error } = await query;

      if (error) {
        console.error('Error fetching management audit:', error);
        return [];
      }

      return audits?.map(audit => ({
        id: audit.id,
        targetUserId: audit.target_user_id,
        performedBy: audit.performed_by,
        performedByName: audit.performed_by_user?.name,
        action: audit.action,
        oldValues: audit.old_values,
        newValues: audit.new_values,
        remarks: audit.remarks,
        createdAt: new Date(audit.created_at)
      })) || [];
    } catch (error) {
      console.error('Error fetching management audit:', error);
      return [];
    }
  }

  static async resetUserPassword(userId: string, performedBy: string): Promise<UserManagementResponse> {
    if (!isSupabaseAvailable()) {
      return {
        success: false,
        message: 'Database connection not available'
      };
    }

    try {
      const tempPassword = this.generateSecurePassword();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          temp_password: tempPassword,
          temp_password_expires_at: expiresAt.toISOString(),
          updated_by: performedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        return {
          success: false,
          message: `Failed to reset password: ${updateError.message}`
        };
      }

      await supabase.rpc('log_user_management_action', {
        p_target_user_id: userId,
        p_performed_by: performedBy,
        p_action: 'password_reset',
        p_remarks: 'Password reset by administrator'
      });

      return {
        success: true,
        message: 'Password reset successfully',
        tempPassword
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while resetting password'
      };
    }
  }

  private static mapDatabaseRoleToAppRole(dbRole: string): 'EMPLOYEE' | 'DO' | 'EO' | 'VENDOR' | 'FINANCE' {
    const roleMap: Record<string, 'EMPLOYEE' | 'DO' | 'EO' | 'VENDOR' | 'FINANCE'> = {
      'employee': 'EMPLOYEE',
      'dept_officer': 'DO',
      'eo': 'EO',
      'vendor': 'VENDOR',
      'finance': 'FINANCE'
    };
    return roleMap[dbRole] || 'EMPLOYEE';
  }

  static mapAppRoleToDatabase(appRole: 'EMPLOYEE' | 'DO' | 'EO' | 'VENDOR' | 'FINANCE'): 'employee' | 'dept_officer' | 'eo' | 'vendor' | 'finance' {
    const roleMap: Record<string, 'employee' | 'dept_officer' | 'eo' | 'vendor' | 'finance'> = {
      'EMPLOYEE': 'employee',
      'DO': 'dept_officer',
      'EO': 'eo',
      'VENDOR': 'vendor',
      'FINANCE': 'finance'
    };
    return roleMap[appRole] || 'employee';
  }
}
