import { supabase } from '../lib/supabase';
import { WorkOrderItemMaster, WorkOrderItemDetail, WorkOrderItemAllocation } from '../types';

export class WorkOrderItemService {
  static async getAllItemsMaster(activeOnly: boolean = true): Promise<WorkOrderItemMaster[]> {
    try {
      let query = supabase
        .from('work_order_items_master')
        .select('*')
        .order('category', { ascending: true })
        .order('description', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        itemCode: item.item_code,
        description: item.description,
        category: item.category,
        subcategory: item.subcategory,
        defaultQuantity: parseFloat(item.default_quantity) || 0,
        unit: item.unit,
        isActive: item.is_active,
        createdBy: item.created_by,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching items master:', error);
      throw error;
    }
  }

  static async getItemMasterById(id: string): Promise<WorkOrderItemMaster | null> {
    try {
      const { data, error } = await supabase
        .from('work_order_items_master')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        itemCode: data.item_code,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        defaultQuantity: parseFloat(data.default_quantity) || 0,
        unit: data.unit,
        isActive: data.is_active,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error fetching item master:', error);
      throw error;
    }
  }

  static async createItemMaster(
    itemData: Omit<WorkOrderItemMaster, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('work_order_items_master')
        .insert([
          {
            item_code: itemData.itemCode,
            description: itemData.description,
            category: itemData.category,
            subcategory: itemData.subcategory,
            default_quantity: itemData.defaultQuantity,
            unit: itemData.unit,
            is_active: itemData.isActive,
            created_by: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating item master:', error);
      throw error;
    }
  }

  static async updateItemMaster(
    id: string,
    updates: Partial<WorkOrderItemMaster>
  ): Promise<void> {
    try {
      const updateData: any = {};

      if (updates.itemCode !== undefined) updateData.item_code = updates.itemCode;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.subcategory !== undefined) updateData.subcategory = updates.subcategory;
      if (updates.defaultQuantity !== undefined) updateData.default_quantity = updates.defaultQuantity;
      if (updates.unit !== undefined) updateData.unit = updates.unit;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { error } = await supabase
        .from('work_order_items_master')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating item master:', error);
      throw error;
    }
  }

  static async deleteItemMaster(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('work_order_items_master')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting item master:', error);
      throw error;
    }
  }

  static async getItemDetailsByTicket(ticketId: string): Promise<WorkOrderItemDetail[]> {
    try {
      const { data, error } = await supabase
        .from('work_order_item_details')
        .select(`
          *,
          item_master:work_order_items_master(*)
        `)
        .eq('ticket_id', ticketId);

      if (error) throw error;

      const itemDetailsWithAllocations = await Promise.all(
        (data || []).map(async (item: any) => {
          const { data: allocations } = await supabase
            .from('work_order_item_allocations')
            .select('allocated_quantity')
            .eq('item_detail_id', item.id);

          const allocatedQuantity = (allocations || []).reduce(
            (sum, alloc) => sum + parseFloat(alloc.allocated_quantity || 0),
            0
          );

          return {
            id: item.id,
            ticketId: item.ticket_id,
            itemMasterId: item.item_master_id,
            itemMaster: item.item_master ? {
              id: item.item_master.id,
              itemCode: item.item_master.item_code,
              description: item.item_master.description,
              category: item.item_master.category,
              subcategory: item.item_master.subcategory,
              defaultQuantity: parseFloat(item.item_master.default_quantity) || 0,
              unit: item.item_master.unit,
              isActive: item.item_master.is_active,
              createdBy: item.item_master.created_by,
              createdAt: new Date(item.item_master.created_at),
              updatedAt: new Date(item.item_master.updated_at),
            } : undefined,
            quantity: parseFloat(item.quantity) || 0,
            unit: item.unit,
            remarks: item.remarks,
            addedBy: item.added_by,
            allocatedQuantity,
            remainingQuantity: parseFloat(item.quantity) - allocatedQuantity,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
          };
        })
      );

      return itemDetailsWithAllocations;
    } catch (error) {
      console.error('Error fetching item details:', error);
      throw error;
    }
  }

  static async addItemToTicket(
    ticketId: string,
    itemMasterId: string,
    quantity: number,
    unit: string,
    remarks: string | undefined,
    userId: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('work_order_item_details')
        .insert([
          {
            ticket_id: ticketId,
            item_master_id: itemMasterId,
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
      console.error('Error adding item to ticket:', error);
      throw error;
    }
  }

  static async updateItemDetail(
    id: string,
    updates: { quantity?: number; unit?: string; remarks?: string }
  ): Promise<void> {
    try {
      const updateData: any = {};

      if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
      if (updates.unit !== undefined) updateData.unit = updates.unit;
      if (updates.remarks !== undefined) updateData.remarks = updates.remarks;

      const { error } = await supabase
        .from('work_order_item_details')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating item detail:', error);
      throw error;
    }
  }

  static async deleteItemDetail(id: string): Promise<void> {
    try {
      const { data: allocations } = await supabase
        .from('work_order_item_allocations')
        .select('id')
        .eq('item_detail_id', id);

      if (allocations && allocations.length > 0) {
        throw new Error('Cannot delete item with active allocations. Please remove allocations first.');
      }

      const { error } = await supabase
        .from('work_order_item_details')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting item detail:', error);
      throw error;
    }
  }

  static async getAllocationsByStep(stepId: string): Promise<WorkOrderItemAllocation[]> {
    try {
      const { data, error } = await supabase
        .from('work_order_item_allocations')
        .select('*')
        .eq('workflow_step_id', stepId);

      if (error) throw error;

      return (data || []).map((alloc: any) => ({
        id: alloc.id,
        itemDetailId: alloc.item_detail_id,
        workflowStepId: alloc.workflow_step_id,
        allocatedQuantity: parseFloat(alloc.allocated_quantity) || 0,
        allocatedBy: alloc.allocated_by,
        createdAt: new Date(alloc.created_at),
        updatedAt: new Date(alloc.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching item allocations:', error);
      throw error;
    }
  }

  static async allocateItemToStep(
    itemDetailId: string,
    workflowStepId: string,
    allocatedQuantity: number,
    userId: string
  ): Promise<string> {
    try {
      const { data: itemDetail } = await supabase
        .from('work_order_item_details')
        .select('quantity')
        .eq('id', itemDetailId)
        .single();

      if (!itemDetail) {
        throw new Error('Item detail not found');
      }

      const { data: existingAllocations } = await supabase
        .from('work_order_item_allocations')
        .select('allocated_quantity')
        .eq('item_detail_id', itemDetailId);

      const totalAllocated = (existingAllocations || []).reduce(
        (sum, alloc) => sum + parseFloat(alloc.allocated_quantity || 0),
        0
      );

      if (totalAllocated + allocatedQuantity > parseFloat(itemDetail.quantity)) {
        throw new Error('Allocation exceeds available quantity');
      }

      const { data, error } = await supabase
        .from('work_order_item_allocations')
        .insert([
          {
            item_detail_id: itemDetailId,
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
      console.error('Error allocating item to step:', error);
      throw error;
    }
  }

  static async updateAllocation(
    id: string,
    allocatedQuantity: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('work_order_item_allocations')
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
        .from('work_order_item_allocations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting allocation:', error);
      throw error;
    }
  }
}
