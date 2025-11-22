import { supabase } from '../lib/supabase';
import { WorkOrderSpecMaster, WorkOrderSpecDetail, WorkOrderSpecAllocation } from '../types';

export class WorkOrderSpecService {
  static async getAllSpecsMaster(activeOnly: boolean = true): Promise<WorkOrderSpecMaster[]> {
    try {
      let query = supabase
        .from('work_order_specs_master')
        .select('*')
        .order('category', { ascending: true })
        .order('description', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((spec: any) => ({
        id: spec.id,
        specCode: spec.spec_code,
        description: spec.description,
        workChunk: spec.work_chunk,
        category: spec.category,
        defaultQuantity: parseFloat(spec.default_quantity) || 0,
        unit: spec.unit,
        isActive: spec.is_active,
        createdBy: spec.created_by,
        createdAt: new Date(spec.created_at),
        updatedAt: new Date(spec.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching specs master:', error);
      throw error;
    }
  }

  static async getSpecMasterById(id: string): Promise<WorkOrderSpecMaster | null> {
    try {
      const { data, error } = await supabase
        .from('work_order_specs_master')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        specCode: data.spec_code,
        description: data.description,
        workChunk: data.work_chunk,
        category: data.category,
        defaultQuantity: parseFloat(data.default_quantity) || 0,
        unit: data.unit,
        isActive: data.is_active,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error fetching spec master:', error);
      throw error;
    }
  }

  static async createSpecMaster(
    specData: Omit<WorkOrderSpecMaster, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('work_order_specs_master')
        .insert([
          {
            spec_code: specData.specCode,
            description: specData.description,
            work_chunk: specData.workChunk,
            category: specData.category,
            default_quantity: specData.defaultQuantity,
            unit: specData.unit,
            is_active: specData.isActive,
            created_by: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating spec master:', error);
      throw error;
    }
  }

  static async updateSpecMaster(
    id: string,
    updates: Partial<WorkOrderSpecMaster>
  ): Promise<void> {
    try {
      const updateData: any = {};

      if (updates.specCode !== undefined) updateData.spec_code = updates.specCode;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.workChunk !== undefined) updateData.work_chunk = updates.workChunk;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.defaultQuantity !== undefined) updateData.default_quantity = updates.defaultQuantity;
      if (updates.unit !== undefined) updateData.unit = updates.unit;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { error } = await supabase
        .from('work_order_specs_master')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating spec master:', error);
      throw error;
    }
  }

  static async deleteSpecMaster(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('work_order_specs_master')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting spec master:', error);
      throw error;
    }
  }

  static async getSpecDetailsByTicket(ticketId: string): Promise<WorkOrderSpecDetail[]> {
    try {
      const { data, error } = await supabase
        .from('work_order_spec_details')
        .select(`
          *,
          spec_master:work_order_specs_master(*)
        `)
        .eq('ticket_id', ticketId);

      if (error) throw error;

      const specDetailsWithAllocations = await Promise.all(
        (data || []).map(async (spec: any) => {
          const { data: allocations } = await supabase
            .from('work_order_spec_allocations')
            .select('allocated_quantity')
            .eq('spec_detail_id', spec.id);

          const allocatedQuantity = (allocations || []).reduce(
            (sum, alloc) => sum + parseFloat(alloc.allocated_quantity || 0),
            0
          );

          return {
            id: spec.id,
            ticketId: spec.ticket_id,
            specMasterId: spec.spec_master_id,
            specMaster: spec.spec_master ? {
              id: spec.spec_master.id,
              specCode: spec.spec_master.spec_code,
              description: spec.spec_master.description,
              workChunk: spec.spec_master.work_chunk,
              category: spec.spec_master.category,
              defaultQuantity: parseFloat(spec.spec_master.default_quantity) || 0,
              unit: spec.spec_master.unit,
              isActive: spec.spec_master.is_active,
              createdBy: spec.spec_master.created_by,
              createdAt: new Date(spec.spec_master.created_at),
              updatedAt: new Date(spec.spec_master.updated_at),
            } : undefined,
            quantity: parseFloat(spec.quantity) || 0,
            unit: spec.unit,
            remarks: spec.remarks,
            addedBy: spec.added_by,
            allocatedQuantity,
            remainingQuantity: parseFloat(spec.quantity) - allocatedQuantity,
            createdAt: new Date(spec.created_at),
            updatedAt: new Date(spec.updated_at),
          };
        })
      );

      return specDetailsWithAllocations;
    } catch (error) {
      console.error('Error fetching spec details:', error);
      throw error;
    }
  }

  static async addSpecToTicket(
    ticketId: string,
    specMasterId: string,
    quantity: number,
    unit: string,
    remarks: string | undefined,
    userId: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('work_order_spec_details')
        .insert([
          {
            ticket_id: ticketId,
            spec_master_id: specMasterId,
            quantity,
            unit,
            remarks,
            added_by: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error adding spec to ticket:', error);
      throw error;
    }
  }

  static async updateSpecDetail(
    id: string,
    updates: { quantity?: number; unit?: string; remarks?: string }
  ): Promise<void> {
    try {
      const updateData: any = {};

      if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
      if (updates.unit !== undefined) updateData.unit = updates.unit;
      if (updates.remarks !== undefined) updateData.remarks = updates.remarks;

      const { error } = await supabase
        .from('work_order_spec_details')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating spec detail:', error);
      throw error;
    }
  }

  static async deleteSpecDetail(id: string): Promise<void> {
    try {
      const { data: allocations } = await supabase
        .from('work_order_spec_allocations')
        .select('id')
        .eq('spec_detail_id', id);

      if (allocations && allocations.length > 0) {
        throw new Error('Cannot delete spec with active allocations. Please remove allocations first.');
      }

      const { error } = await supabase
        .from('work_order_spec_details')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting spec detail:', error);
      throw error;
    }
  }

  static async getAllocationsByStep(stepId: string): Promise<WorkOrderSpecAllocation[]> {
    try {
      const { data, error } = await supabase
        .from('work_order_spec_allocations')
        .select('*')
        .eq('workflow_step_id', stepId);

      if (error) throw error;

      return (data || []).map((alloc: any) => ({
        id: alloc.id,
        specDetailId: alloc.spec_detail_id,
        workflowStepId: alloc.workflow_step_id,
        allocatedQuantity: parseFloat(alloc.allocated_quantity) || 0,
        allocatedBy: alloc.allocated_by,
        createdAt: new Date(alloc.created_at),
        updatedAt: new Date(alloc.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching spec allocations:', error);
      throw error;
    }
  }

  static async getSpecDetailsForStep(stepId: string): Promise<Array<WorkOrderSpecDetail & { allocation: WorkOrderSpecAllocation }>> {
    try {
      const { data, error } = await supabase
        .from('work_order_spec_allocations')
        .select(`
          *,
          spec_detail:work_order_spec_details(
            *,
            spec_master:work_order_specs_master(*)
          )
        `)
        .eq('workflow_step_id', stepId);

      if (error) throw error;

      return (data || []).map((alloc: any) => {
        const spec = alloc.spec_detail;
        return {
          id: spec.id,
          ticketId: spec.ticket_id,
          specMasterId: spec.spec_master_id,
          specMaster: spec.spec_master ? {
            id: spec.spec_master.id,
            specCode: spec.spec_master.spec_code,
            description: spec.spec_master.description,
            workChunk: spec.spec_master.work_chunk,
            category: spec.spec_master.category,
            defaultQuantity: parseFloat(spec.spec_master.default_quantity) || 0,
            unit: spec.spec_master.unit,
            isActive: spec.spec_master.is_active,
            createdBy: spec.spec_master.created_by,
            createdAt: new Date(spec.spec_master.created_at),
            updatedAt: new Date(spec.spec_master.updated_at),
          } : undefined,
          quantity: parseFloat(spec.quantity) || 0,
          unit: spec.unit,
          remarks: spec.remarks,
          addedBy: spec.added_by,
          allocatedQuantity: 0,
          remainingQuantity: 0,
          createdAt: new Date(spec.created_at),
          updatedAt: new Date(spec.updated_at),
          allocation: {
            id: alloc.id,
            specDetailId: alloc.spec_detail_id,
            workflowStepId: alloc.workflow_step_id,
            allocatedQuantity: parseFloat(alloc.allocated_quantity) || 0,
            allocatedBy: alloc.allocated_by,
            createdAt: new Date(alloc.created_at),
            updatedAt: new Date(alloc.updated_at),
          }
        };
      });
    } catch (error) {
      console.error('Error fetching spec details for step:', error);
      throw error;
    }
  }

  static async allocateSpecToStep(
    specDetailId: string,
    workflowStepId: string,
    allocatedQuantity: number,
    userId: string
  ): Promise<string> {
    try {
      const { data: specDetail } = await supabase
        .from('work_order_spec_details')
        .select('quantity')
        .eq('id', specDetailId)
        .single();

      if (!specDetail) {
        throw new Error('Spec detail not found');
      }

      const { data: existingAllocations } = await supabase
        .from('work_order_spec_allocations')
        .select('allocated_quantity')
        .eq('spec_detail_id', specDetailId);

      const totalAllocated = (existingAllocations || []).reduce(
        (sum, alloc) => sum + parseFloat(alloc.allocated_quantity || 0),
        0
      );

      if (totalAllocated + allocatedQuantity > parseFloat(specDetail.quantity)) {
        throw new Error('Allocation exceeds available quantity');
      }

      const { data, error } = await supabase
        .from('work_order_spec_allocations')
        .insert([
          {
            spec_detail_id: specDetailId,
            workflow_step_id: workflowStepId,
            allocated_quantity: allocatedQuantity,
            allocated_by: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error allocating spec to step:', error);
      throw error;
    }
  }

  static async updateAllocation(
    id: string,
    allocatedQuantity: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('work_order_spec_allocations')
        .update({ allocated_quantity: allocatedQuantity })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating allocation:', error);
      throw error;
    }
  }

  static async deleteAllocation(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('work_order_spec_allocations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting allocation:', error);
      throw error;
    }
  }
}
