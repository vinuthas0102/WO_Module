import { supabase } from '../lib/supabase';
import { UserDisplayPreferences, IconDisplayType, IconSize } from '../types';

interface PreferencesCache {
  data: UserDisplayPreferences | null;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000;
const preferencesCache = new Map<string, PreferencesCache>();

export class UserPreferencesService {
  static async getUserPreferences(userId: string): Promise<UserDisplayPreferences | null> {
    const cached = preferencesCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('user_display_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user preferences:', error);
        return null;
      }

      const preferences = data ? this.mapToPreferences(data) : null;

      preferencesCache.set(userId, {
        data: preferences,
        timestamp: Date.now()
      });

      return preferences;
    } catch (error) {
      console.error('Failed to fetch user preferences:', error);
      return null;
    }
  }

  static async saveUserPreferences(
    userId: string,
    preferences: Partial<Omit<UserDisplayPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<{ success: boolean; data?: UserDisplayPreferences; error?: string }> {
    try {
      const existing = await this.getUserPreferences(userId);

      if (existing) {
        const { data, error } = await supabase
          .from('user_display_preferences')
          .update({
            icon_display_type: preferences.iconDisplayType,
            icon_size: preferences.iconSize,
            show_labels: preferences.showLabels,
            group_by_category: preferences.groupByCategory,
            animation_enabled: preferences.animationEnabled,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          console.error('Error updating user preferences:', error);
          return { success: false, error: error.message };
        }

        const updatedPreferences = this.mapToPreferences(data);
        this.updateCache(userId, updatedPreferences);

        return { success: true, data: updatedPreferences };
      } else {
        const { data, error } = await supabase
          .from('user_display_preferences')
          .insert({
            user_id: userId,
            icon_display_type: preferences.iconDisplayType || 'dropdown_menu',
            icon_size: preferences.iconSize || 'medium',
            show_labels: preferences.showLabels !== undefined ? preferences.showLabels : true,
            group_by_category: preferences.groupByCategory || false,
            animation_enabled: preferences.animationEnabled !== undefined ? preferences.animationEnabled : true
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating user preferences:', error);
          return { success: false, error: error.message };
        }

        const newPreferences = this.mapToPreferences(data);
        this.updateCache(userId, newPreferences);

        return { success: true, data: newPreferences };
      }
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async resetToDefaults(userId: string): Promise<{ success: boolean; data?: UserDisplayPreferences; error?: string }> {
    return this.saveUserPreferences(userId, {
      iconDisplayType: 'dropdown_menu',
      iconSize: 'medium',
      showLabels: true,
      groupByCategory: false,
      animationEnabled: true
    });
  }

  static async initializeDefaultPreferences(userId: string): Promise<UserDisplayPreferences | null> {
    const existing = await this.getUserPreferences(userId);
    if (existing) {
      return existing;
    }

    const result = await this.saveUserPreferences(userId, {
      iconDisplayType: 'dropdown_menu',
      iconSize: 'medium',
      showLabels: true,
      groupByCategory: false,
      animationEnabled: true
    });

    return result.success ? result.data || null : null;
  }

  static clearCache(userId?: string): void {
    if (userId) {
      preferencesCache.delete(userId);
    } else {
      preferencesCache.clear();
    }
  }

  private static updateCache(userId: string, preferences: UserDisplayPreferences): void {
    preferencesCache.set(userId, {
      data: preferences,
      timestamp: Date.now()
    });
  }

  private static mapToPreferences(data: any): UserDisplayPreferences {
    return {
      id: data.id,
      userId: data.user_id,
      iconDisplayType: data.icon_display_type as IconDisplayType,
      iconSize: data.icon_size as IconSize,
      showLabels: data.show_labels,
      groupByCategory: data.group_by_category,
      animationEnabled: data.animation_enabled,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  static getDefaultPreferences(): UserDisplayPreferences {
    return {
      id: '',
      userId: '',
      iconDisplayType: 'dropdown_menu',
      iconSize: 'medium',
      showLabels: true,
      groupByCategory: false,
      animationEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
