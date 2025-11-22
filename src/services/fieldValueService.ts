import { supabase } from '../lib/supabase';
import { TicketFieldValue, WorkflowStepFieldValue } from '../types';

export class FieldValueService {
  static async saveTicketFieldValues(
    ticketId: string,
    fieldValues: Record<string, any>
  ): Promise<void> {
    try {
      const entries = Object.entries(fieldValues).map(([field_key, field_value]) => ({
        ticket_id: ticketId,
        field_key,
        field_value: typeof field_value === 'object' ? JSON.stringify(field_value) : String(field_value || '')
      }));

      const { error } = await supabase
        .from('ticket_field_values')
        .upsert(entries, {
          onConflict: 'ticket_id,field_key'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving ticket field values:', error);
      throw error;
    }
  }

  static async getTicketFieldValues(ticketId: string): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('ticket_field_values')
        .select('*')
        .eq('ticket_id', ticketId);

      if (error) throw error;

      const fieldValues: Record<string, any> = {};
      (data || []).forEach(item => {
        try {
          fieldValues[item.field_key] = JSON.parse(item.field_value);
        } catch {
          fieldValues[item.field_key] = item.field_value;
        }
      });

      return fieldValues;
    } catch (error) {
      console.error('Error fetching ticket field values:', error);
      throw error;
    }
  }

  static async updateTicketFieldValue(
    ticketId: string,
    fieldKey: string,
    fieldValue: any
  ): Promise<void> {
    try {
      const valueStr = typeof fieldValue === 'object' ? JSON.stringify(fieldValue) : String(fieldValue || '');

      const { error } = await supabase
        .from('ticket_field_values')
        .upsert({
          ticket_id: ticketId,
          field_key: fieldKey,
          field_value: valueStr
        }, {
          onConflict: 'ticket_id,field_key'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating ticket field value:', error);
      throw error;
    }
  }

  static async deleteTicketFieldValue(ticketId: string, fieldKey: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ticket_field_values')
        .delete()
        .eq('ticket_id', ticketId)
        .eq('field_key', fieldKey);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting ticket field value:', error);
      throw error;
    }
  }

  static async saveWorkflowStepFieldValues(
    workflowStepId: string,
    fieldValues: Record<string, any>
  ): Promise<void> {
    try {
      const entries = Object.entries(fieldValues).map(([field_key, field_value]) => ({
        workflow_step_id: workflowStepId,
        field_key,
        field_value: typeof field_value === 'object' ? JSON.stringify(field_value) : String(field_value || '')
      }));

      const { error } = await supabase
        .from('workflow_step_field_values')
        .upsert(entries, {
          onConflict: 'workflow_step_id,field_key'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving workflow step field values:', error);
      throw error;
    }
  }

  static async getWorkflowStepFieldValues(workflowStepId: string): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('workflow_step_field_values')
        .select('*')
        .eq('workflow_step_id', workflowStepId);

      if (error) throw error;

      const fieldValues: Record<string, any> = {};
      (data || []).forEach(item => {
        try {
          fieldValues[item.field_key] = JSON.parse(item.field_value);
        } catch {
          fieldValues[item.field_key] = item.field_value;
        }
      });

      return fieldValues;
    } catch (error) {
      console.error('Error fetching workflow step field values:', error);
      throw error;
    }
  }

  static async updateWorkflowStepFieldValue(
    workflowStepId: string,
    fieldKey: string,
    fieldValue: any
  ): Promise<void> {
    try {
      const valueStr = typeof fieldValue === 'object' ? JSON.stringify(fieldValue) : String(fieldValue || '');

      const { error } = await supabase
        .from('workflow_step_field_values')
        .upsert({
          workflow_step_id: workflowStepId,
          field_key: fieldKey,
          field_value: valueStr
        }, {
          onConflict: 'workflow_step_id,field_key'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating workflow step field value:', error);
      throw error;
    }
  }

  static async deleteWorkflowStepFieldValue(workflowStepId: string, fieldKey: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_step_field_values')
        .delete()
        .eq('workflow_step_id', workflowStepId)
        .eq('field_key', fieldKey);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting workflow step field value:', error);
      throw error;
    }
  }

  static async getBatchTicketFieldValues(ticketIds: string[]): Promise<Record<string, Record<string, any>>> {
    try {
      const { data, error } = await supabase
        .from('ticket_field_values')
        .select('*')
        .in('ticket_id', ticketIds);

      if (error) throw error;

      const result: Record<string, Record<string, any>> = {};
      (data || []).forEach(item => {
        if (!result[item.ticket_id]) {
          result[item.ticket_id] = {};
        }
        try {
          result[item.ticket_id][item.field_key] = JSON.parse(item.field_value);
        } catch {
          result[item.ticket_id][item.field_key] = item.field_value;
        }
      });

      return result;
    } catch (error) {
      console.error('Error fetching batch ticket field values:', error);
      throw error;
    }
  }

  static async getBatchWorkflowStepFieldValues(stepIds: string[]): Promise<Record<string, Record<string, any>>> {
    try {
      const { data, error } = await supabase
        .from('workflow_step_field_values')
        .select('*')
        .in('workflow_step_id', stepIds);

      if (error) throw error;

      const result: Record<string, Record<string, any>> = {};
      (data || []).forEach(item => {
        if (!result[item.workflow_step_id]) {
          result[item.workflow_step_id] = {};
        }
        try {
          result[item.workflow_step_id][item.field_key] = JSON.parse(item.field_value);
        } catch {
          result[item.workflow_step_id][item.field_key] = item.field_value;
        }
      });

      return result;
    } catch (error) {
      console.error('Error fetching batch workflow step field values:', error);
      throw error;
    }
  }
}
