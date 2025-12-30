import { supabase } from '../lib/supabase';
import { AuthService } from './authService';

export interface MeasurementBookEntry {
  id: string;
  mbookNumber: string;
  ticketId: string;
  specAllocationId?: string;
  workflowStepId?: string;
  entryDate: string;
  description: string;
  quantityMeasured: number;
  unit: string;
  rate: number;
  amount: number;
  workType: 'work' | 'procurement';
  status: 'draft' | 'submitted' | 'verified' | 'approved';
  createdBy: string;
  verifiedBy?: string;
  verificationDate?: string;
  approvedBy?: string;
  approvalDate?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeasurementBookEntryWithDetails extends MeasurementBookEntry {
  specAllocation?: {
    id: string;
    allocatedQuantity: number;
    specDetail: {
      description: string;
      specCode: string;
      unit: string;
    };
  };
  workflowStep?: {
    id: string;
    title: string;
    hierarchyLevel?: number;
    level1?: number;
    level2?: number;
    level3?: number;
  };
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
  verifiedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  approvedByUser?: {
    id: string;
    name: string;
    email: string;
  };
}

export class MeasurementBookService {
  static async getMbookEntriesByTicket(ticketId: string): Promise<MeasurementBookEntryWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('measurement_book_entries')
        .select(`
          *,
          createdByUser:users!created_by(id, name, email),
          verifiedByUser:users!verified_by(id, name, email),
          approvedByUser:users!approved_by(id, name, email),
          specAllocation:work_order_spec_allocations(
            id,
            allocated_quantity,
            specDetail:work_order_spec_details(
              spec_master:work_order_specs_master(description, spec_code, unit)
            )
          ),
          workflowStep:workflow_steps(id, title, level_1, level_2, level_3)
        `)
        .eq('ticket_id', ticketId)
        .order('entry_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(entry => this.mapToMbookEntry(entry));
    } catch (error) {
      console.error('Error fetching mbook entries:', error);
      throw error;
    }
  }

  static async getMbookEntryById(entryId: string): Promise<MeasurementBookEntryWithDetails> {
    try {
      const { data, error } = await supabase
        .from('measurement_book_entries')
        .select(`
          *,
          createdByUser:users!created_by(id, name, email),
          verifiedByUser:users!verified_by(id, name, email),
          approvedByUser:users!approved_by(id, name, email),
          specAllocation:work_order_spec_allocations(
            id,
            allocated_quantity,
            specDetail:work_order_spec_details(
              spec_master:work_order_specs_master(description, spec_code, unit)
            )
          ),
          workflowStep:workflow_steps(id, title, level_1, level_2, level_3)
        `)
        .eq('id', entryId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Mbook entry not found');

      return this.mapToMbookEntry(data);
    } catch (error) {
      console.error('Error fetching mbook entry:', error);
      throw error;
    }
  }

  static async getMbookEntriesByStatus(ticketId: string, status: string): Promise<MeasurementBookEntryWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('measurement_book_entries')
        .select(`
          *,
          createdByUser:users!created_by(id, name, email),
          verifiedByUser:users!verified_by(id, name, email),
          approvedByUser:users!approved_by(id, name, email),
          specAllocation:work_order_spec_allocations(
            id,
            allocated_quantity,
            specDetail:work_order_spec_details(
              spec_master:work_order_specs_master(description, spec_code, unit)
            )
          ),
          workflowStep:workflow_steps(id, title, level_1, level_2, level_3)
        `)
        .eq('ticket_id', ticketId)
        .eq('status', status)
        .order('entry_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(entry => this.mapToMbookEntry(entry));
    } catch (error) {
      console.error('Error fetching mbook entries by status:', error);
      throw error;
    }
  }

  static async createMbookEntry(
    ticketId: string,
    specAllocationId: string | undefined,
    workflowStepId: string | undefined,
    description: string,
    quantityMeasured: number,
    unit: string,
    rate: number,
    workType: 'work' | 'procurement',
    entryDate: string,
    remarks: string | undefined,
    userId: string
  ): Promise<string> {
    try {
      // Validate that the user exists before creating the measurement book entry
      const userExists = await AuthService.validateUserExists(userId);
      if (!userExists) {
        throw new Error(`User with ID ${userId} does not exist in the database. Please ensure you are logged in correctly.`);
      }

      const { data: mbookNumberData, error: mbookNumberError } = await supabase
        .rpc('get_next_mbook_number', { p_ticket_id: ticketId });

      if (mbookNumberError) throw mbookNumberError;

      const mbookNumber = mbookNumberData || `TKT-MB-001`;
      const amount = quantityMeasured * rate;

      const { data, error } = await supabase
        .from('measurement_book_entries')
        .insert([
          {
            mbook_number: mbookNumber,
            ticket_id: ticketId,
            spec_allocation_id: specAllocationId,
            workflow_step_id: workflowStepId,
            description,
            quantity_measured: quantityMeasured,
            unit,
            rate,
            amount,
            work_type: workType,
            entry_date: entryDate,
            remarks,
            status: 'draft',
            created_by: userId,
          },
        ])
        .select('id')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create mbook entry');

      return data.id;
    } catch (error) {
      console.error('Error creating mbook entry:', error);
      throw error;
    }
  }

  static async createBatchMbookEntries(
    ticketId: string,
    entries: Array<{
      specAllocationId: string;
      description: string;
      quantityMeasured: number;
      unit: string;
      rate: number;
    }>,
    workType: 'work' | 'procurement',
    entryDate: string,
    remarks: string | undefined,
    userId: string
  ): Promise<{ success: string[]; failed: Array<{ allocationId: string; error: string }> }> {
    const results = {
      success: [] as string[],
      failed: [] as Array<{ allocationId: string; error: string }>,
    };

    for (const entry of entries) {
      try {
        const entryId = await this.createMbookEntry(
          ticketId,
          entry.specAllocationId,
          undefined,
          entry.description,
          entry.quantityMeasured,
          entry.unit,
          entry.rate,
          workType,
          entryDate,
          remarks,
          userId
        );
        results.success.push(entryId);
      } catch (error: any) {
        results.failed.push({
          allocationId: entry.specAllocationId,
          error: error.message || 'Unknown error',
        });
      }
    }

    return results;
  }

  static async updateMbookEntry(
    entryId: string,
    description: string,
    quantityMeasured: number,
    rate: number,
    entryDate: string,
    remarks: string | undefined
  ): Promise<void> {
    try {
      const amount = quantityMeasured * rate;

      const { error } = await supabase
        .from('measurement_book_entries')
        .update({
          description,
          quantity_measured: quantityMeasured,
          rate,
          amount,
          entry_date: entryDate,
          remarks,
        })
        .eq('id', entryId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating mbook entry:', error);
      throw error;
    }
  }

  static async updateMbookStatus(
    entryId: string,
    status: 'draft' | 'submitted' | 'verified' | 'approved',
    userId: string
  ): Promise<void> {
    try {
      // Validate that the user exists before updating status
      const userExists = await AuthService.validateUserExists(userId);
      if (!userExists) {
        throw new Error(`User with ID ${userId} does not exist in the database. Please ensure you are logged in correctly.`);
      }

      const updateData: any = { status };

      if (status === 'verified') {
        updateData.verified_by = userId;
        updateData.verification_date = new Date().toISOString();
      } else if (status === 'approved') {
        updateData.approved_by = userId;
        updateData.approval_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('measurement_book_entries')
        .update(updateData)
        .eq('id', entryId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating mbook status:', error);
      throw error;
    }
  }

  static async deleteMbookEntry(entryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('measurement_book_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting mbook entry:', error);
      throw error;
    }
  }

  static async getTotalMeasuredByAllocation(allocationId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('measurement_book_entries')
        .select('quantity_measured')
        .eq('spec_allocation_id', allocationId)
        .in('status', ['verified', 'approved']);

      if (error) throw error;

      return (data || []).reduce((sum, entry) => sum + parseFloat(entry.quantity_measured || 0), 0);
    } catch (error) {
      console.error('Error getting total measured:', error);
      return 0;
    }
  }

  private static mapToMbookEntry(data: any): MeasurementBookEntryWithDetails {
    return {
      id: data.id,
      mbookNumber: data.mbook_number,
      ticketId: data.ticket_id,
      specAllocationId: data.spec_allocation_id,
      workflowStepId: data.workflow_step_id,
      entryDate: data.entry_date,
      description: data.description,
      quantityMeasured: parseFloat(data.quantity_measured) || 0,
      unit: data.unit,
      rate: parseFloat(data.rate) || 0,
      amount: parseFloat(data.amount) || 0,
      workType: data.work_type,
      status: data.status,
      createdBy: data.created_by,
      verifiedBy: data.verified_by,
      verificationDate: data.verification_date,
      approvedBy: data.approved_by,
      approvalDate: data.approval_date,
      remarks: data.remarks,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      specAllocation: data.specAllocation ? {
        id: data.specAllocation.id,
        allocatedQuantity: parseFloat(data.specAllocation.allocated_quantity) || 0,
        specDetail: {
          description: data.specAllocation.specDetail?.spec_master?.description || '',
          specCode: data.specAllocation.specDetail?.spec_master?.spec_code || '',
          unit: data.specAllocation.specDetail?.spec_master?.unit || '',
        },
      } : undefined,
      workflowStep: data.workflowStep ? {
        id: data.workflowStep.id,
        title: data.workflowStep.title,
        level1: data.workflowStep.level_1,
        level2: data.workflowStep.level_2,
        level3: data.workflowStep.level_3,
        hierarchyLevel: data.workflowStep.level_3 ? 3 : data.workflowStep.level_2 ? 2 : data.workflowStep.level_1 ? 1 : 0,
      } : undefined,
      createdByUser: data.createdByUser,
      verifiedByUser: data.verifiedByUser,
      approvedByUser: data.approvedByUser,
    };
  }
}
