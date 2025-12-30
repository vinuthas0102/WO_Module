import { supabase } from '../lib/supabase';
import { AuthService } from './authService';

export interface Bill {
  id: string;
  billNumber: string;
  ticketId: string;
  billDate: string;
  totalAmount: number;
  billType: 'work' | 'procurement' | 'mixed';
  status: 'draft' | 'submitted' | 'approved' | 'paid';
  description?: string;
  createdBy: string;
  approvedBy?: string;
  approvalDate?: string;
  paymentDate?: string;
  paymentReference?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillWithDetails extends Bill {
  mbookEntries: {
    id: string;
    mbookNumber: string;
    description: string;
    quantityMeasured: number;
    unit: string;
    rate: number;
    amount: number;
    workType: string;
  }[];
  createdByUser?: {
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

export class BillingService {
  static async getBillsByTicket(ticketId: string): Promise<BillWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          createdByUser:users!bills_created_by_fkey(id, name, email),
          approvedByUser:users!bills_approved_by_fkey(id, name, email)
        `)
        .eq('ticket_id', ticketId)
        .order('bill_date', { ascending: false });

      if (error) throw error;

      const billsWithEntries = await Promise.all(
        (data || []).map(async (bill) => {
          const mbookEntries = await this.getMbookEntriesForBill(bill.id);
          return this.mapToBill(bill, mbookEntries);
        })
      );

      return billsWithEntries;
    } catch (error) {
      console.error('Error fetching bills:', error);
      throw error;
    }
  }

  static async getBillById(billId: string): Promise<BillWithDetails> {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          createdByUser:users!bills_created_by_fkey(id, name, email),
          approvedByUser:users!bills_approved_by_fkey(id, name, email)
        `)
        .eq('id', billId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Bill not found');

      const mbookEntries = await this.getMbookEntriesForBill(billId);
      return this.mapToBill(data, mbookEntries);
    } catch (error) {
      console.error('Error fetching bill:', error);
      throw error;
    }
  }

  static async createBill(
    ticketId: string,
    mbookEntryIds: string[],
    billDate: string,
    description: string | undefined,
    remarks: string | undefined,
    userId: string
  ): Promise<string> {
    try {
      if (mbookEntryIds.length === 0) {
        throw new Error('At least one measurement book entry is required');
      }

      // Validate that the user exists before creating the bill
      const userExists = await AuthService.validateUserExists(userId);
      if (!userExists) {
        throw new Error(`User with ID ${userId} does not exist in the database. Please ensure you are logged in correctly.`);
      }

      const { data: billNumberData, error: billNumberError } = await supabase
        .rpc('get_next_bill_number');

      if (billNumberError) throw billNumberError;

      const billNumber = billNumberData || `BILL-25-0001`;

      const { data: mbookEntries, error: mbookError } = await supabase
        .from('measurement_book_entries')
        .select('work_type, amount')
        .in('id', mbookEntryIds);

      if (mbookError) throw mbookError;

      const totalAmount = (mbookEntries || []).reduce(
        (sum, entry) => sum + parseFloat(entry.amount || 0),
        0
      );

      const workTypes = new Set((mbookEntries || []).map(e => e.work_type));
      let billType: 'work' | 'procurement' | 'mixed';
      if (workTypes.size === 1) {
        billType = workTypes.has('work') ? 'work' : 'procurement';
      } else {
        billType = 'mixed';
      }

      const { data, error } = await supabase
        .from('bills')
        .insert([
          {
            bill_number: billNumber,
            ticket_id: ticketId,
            bill_date: billDate,
            total_amount: totalAmount,
            bill_type: billType,
            status: 'draft',
            description,
            remarks,
            created_by: userId,
          },
        ])
        .select('id')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create bill');

      const billId = data.id;

      const { error: linkError } = await supabase
        .from('bill_mbook_entries')
        .insert(
          mbookEntryIds.map(entryId => ({
            bill_id: billId,
            mbook_entry_id: entryId,
          }))
        );

      if (linkError) throw linkError;

      return billId;
    } catch (error) {
      console.error('Error creating bill:', error);
      throw error;
    }
  }

  static async updateBill(
    billId: string,
    billDate: string,
    description: string | undefined,
    remarks: string | undefined
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('bills')
        .update({
          bill_date: billDate,
          description,
          remarks,
        })
        .eq('id', billId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  }

  static async updateBillStatus(
    billId: string,
    status: 'draft' | 'submitted' | 'approved' | 'paid',
    userId: string,
    paymentDate?: string,
    paymentReference?: string
  ): Promise<void> {
    try {
      // Validate that the user exists before updating the bill
      const userExists = await AuthService.validateUserExists(userId);
      if (!userExists) {
        throw new Error(`User with ID ${userId} does not exist in the database. Please ensure you are logged in correctly.`);
      }

      const updateData: any = { status };

      if (status === 'approved') {
        updateData.approved_by = userId;
        updateData.approval_date = new Date().toISOString();
      } else if (status === 'paid') {
        updateData.payment_date = paymentDate;
        updateData.payment_reference = paymentReference;
      }

      const { error } = await supabase
        .from('bills')
        .update(updateData)
        .eq('id', billId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating bill status:', error);
      throw error;
    }
  }

  static async deleteBill(billId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', billId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  }

  static async addMbookEntriesToBill(billId: string, mbookEntryIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('bill_mbook_entries')
        .insert(
          mbookEntryIds.map(entryId => ({
            bill_id: billId,
            mbook_entry_id: entryId,
          }))
        );

      if (error) throw error;
    } catch (error) {
      console.error('Error adding mbook entries to bill:', error);
      throw error;
    }
  }

  static async removeMbookEntryFromBill(billId: string, mbookEntryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bill_mbook_entries')
        .delete()
        .eq('bill_id', billId)
        .eq('mbook_entry_id', mbookEntryId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing mbook entry from bill:', error);
      throw error;
    }
  }

  private static async getMbookEntriesForBill(billId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('bill_mbook_entries')
        .select(`
          mbook_entry:measurement_book_entries(
            id,
            mbook_number,
            description,
            quantity_measured,
            unit,
            rate,
            amount,
            work_type
          )
        `)
        .eq('bill_id', billId);

      if (error) throw error;

      return (data || []).map(item => item.mbook_entry).filter(Boolean);
    } catch (error) {
      console.error('Error fetching mbook entries for bill:', error);
      return [];
    }
  }

  private static mapToBill(data: any, mbookEntries: any[]): BillWithDetails {
    return {
      id: data.id,
      billNumber: data.bill_number,
      ticketId: data.ticket_id,
      billDate: data.bill_date,
      totalAmount: parseFloat(data.total_amount) || 0,
      billType: data.bill_type,
      status: data.status,
      description: data.description,
      createdBy: data.created_by,
      approvedBy: data.approved_by,
      approvalDate: data.approval_date,
      paymentDate: data.payment_date,
      paymentReference: data.payment_reference,
      remarks: data.remarks,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      mbookEntries: mbookEntries.map(entry => ({
        id: entry.id,
        mbookNumber: entry.mbook_number,
        description: entry.description,
        quantityMeasured: parseFloat(entry.quantity_measured) || 0,
        unit: entry.unit,
        rate: parseFloat(entry.rate) || 0,
        amount: parseFloat(entry.amount) || 0,
        workType: entry.work_type,
      })),
      createdByUser: data.createdByUser,
      approvedByUser: data.approvedByUser,
    };
  }
}
