import { supabase } from '../lib/supabase';
import {
  ModuleFieldConfiguration,
  FieldDropdownOption,
  FieldContext,
  FieldType,
  ValidationRules,
  RoleVisibility,
  ConditionalVisibility,
  User
} from '../types';

export class FieldConfigService {
  static async getModuleFieldConfig(
    moduleId: string,
    context: FieldContext,
    userRole?: User['role']
  ): Promise<ModuleFieldConfiguration[]> {
    try {
      const { data, error } = await supabase
        .from('module_field_configurations')
        .select('*')
        .eq('module_id', moduleId)
        .eq('context', context)
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      let fields = data || [];

      if (userRole) {
        fields = fields.filter(field => {
          const visibility = field.role_visibility as RoleVisibility;
          return visibility[userRole] === true;
        });
      }

      return fields.map(field => ({
        ...field,
        created_at: new Date(field.created_at),
        updated_at: new Date(field.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching module field config:', error);
      throw error;
    }
  }

  static async getFieldDropdownOptions(fieldConfigId: string): Promise<FieldDropdownOption[]> {
    try {
      const { data, error } = await supabase
        .from('field_dropdown_options')
        .select('*')
        .eq('field_config_id', fieldConfigId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return (data || []).map(option => ({
        ...option,
        created_at: new Date(option.created_at)
      }));
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
      throw error;
    }
  }

  static async getAllFieldsWithOptions(
    moduleId: string,
    context: FieldContext,
    userRole?: User['role']
  ): Promise<Array<ModuleFieldConfiguration & { options?: FieldDropdownOption[] }>> {
    const fields = await this.getModuleFieldConfig(moduleId, context, userRole);

    const fieldsWithOptions = await Promise.all(
      fields.map(async (field) => {
        if (field.field_type === 'dropdown' || field.field_type === 'multi_select') {
          const options = await this.getFieldDropdownOptions(field.id);
          return { ...field, options };
        }
        return field;
      })
    );

    return fieldsWithOptions;
  }

  static async createFieldConfiguration(
    config: Omit<ModuleFieldConfiguration, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ModuleFieldConfiguration> {
    try {
      const { data, error } = await supabase
        .from('module_field_configurations')
        .insert([config])
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error creating field configuration:', error);
      throw error;
    }
  }

  static async updateFieldConfiguration(
    id: string,
    updates: Partial<Omit<ModuleFieldConfiguration, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<ModuleFieldConfiguration> {
    try {
      const { data, error } = await supabase
        .from('module_field_configurations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error updating field configuration:', error);
      throw error;
    }
  }

  static async deleteFieldConfiguration(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('module_field_configurations')
        .delete()
        .eq('id', id)
        .eq('is_system_field', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting field configuration:', error);
      throw error;
    }
  }

  static async reorderFields(
    moduleId: string,
    context: FieldContext,
    fieldOrders: Array<{ id: string; display_order: number }>
  ): Promise<void> {
    try {
      const updates = fieldOrders.map(({ id, display_order }) =>
        supabase
          .from('module_field_configurations')
          .update({ display_order })
          .eq('id', id)
          .eq('module_id', moduleId)
          .eq('context', context)
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Error reordering fields:', error);
      throw error;
    }
  }

  static async createDropdownOption(
    option: Omit<FieldDropdownOption, 'id' | 'created_at'>
  ): Promise<FieldDropdownOption> {
    try {
      const { data, error } = await supabase
        .from('field_dropdown_options')
        .insert([option])
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        created_at: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error creating dropdown option:', error);
      throw error;
    }
  }

  static async updateDropdownOption(
    id: string,
    updates: Partial<Omit<FieldDropdownOption, 'id' | 'created_at'>>
  ): Promise<FieldDropdownOption> {
    try {
      const { data, error } = await supabase
        .from('field_dropdown_options')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        created_at: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error updating dropdown option:', error);
      throw error;
    }
  }

  static async deleteDropdownOption(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('field_dropdown_options')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting dropdown option:', error);
      throw error;
    }
  }

  static validateFieldValue(
    value: any,
    config: ModuleFieldConfiguration
  ): { valid: boolean; error?: string } {
    const rules = config.validation_rules;

    if (config.is_required && (value === null || value === undefined || value === '')) {
      return { valid: false, error: `${config.label} is required` };
    }

    if (!value && !config.is_required) {
      return { valid: true };
    }

    switch (config.field_type) {
      case 'text':
      case 'alphanumeric':
      case 'textarea':
        if (typeof value !== 'string') {
          return { valid: false, error: 'Value must be text' };
        }
        if (rules.minLength && value.length < rules.minLength) {
          return { valid: false, error: `Minimum length is ${rules.minLength}` };
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          return { valid: false, error: `Maximum length is ${rules.maxLength}` };
        }
        if (config.field_type === 'alphanumeric' && rules.pattern) {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(value)) {
            return { valid: false, error: 'Value must be alphanumeric' };
          }
        }
        break;

      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          return { valid: false, error: 'Value must be a number' };
        }
        if (rules.min !== undefined && num < rules.min) {
          return { valid: false, error: `Minimum value is ${rules.min}` };
        }
        if (rules.max !== undefined && num > rules.max) {
          return { valid: false, error: `Maximum value is ${rules.max}` };
        }
        break;

      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return { valid: false, error: 'Invalid date format' };
        }
        if (rules.minDate) {
          const minDate = rules.minDate === 'today' ? new Date() : new Date(rules.minDate);
          if (date < minDate) {
            return { valid: false, error: `Date must be after ${minDate.toLocaleDateString()}` };
          }
        }
        if (rules.maxDate) {
          const maxDate = new Date(rules.maxDate);
          if (date > maxDate) {
            return { valid: false, error: `Date must be before ${maxDate.toLocaleDateString()}` };
          }
        }
        break;

      case 'multi_select':
        if (!Array.isArray(value)) {
          return { valid: false, error: 'Value must be an array' };
        }
        if (rules.minSelections && value.length < rules.minSelections) {
          return { valid: false, error: `Select at least ${rules.minSelections} options` };
        }
        if (rules.maxSelections && value.length > rules.maxSelections) {
          return { valid: false, error: `Select at most ${rules.maxSelections} options` };
        }
        break;
    }

    return { valid: true };
  }
}
