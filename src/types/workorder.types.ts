export interface WorkOrderItemMaster {
  id: string;
  itemCode: string;
  description: string;
  category: string;
  subcategory?: string;
  defaultQuantity: number;
  unit: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrderSpecMaster {
  id: string;
  specCode: string;
  description: string;
  workChunk: string;
  category: string;
  defaultQuantity: number;
  unit: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrderItemDetail {
  id: string;
  ticketId: string;
  itemMasterId: string;
  itemMaster?: WorkOrderItemMaster;
  quantity: number;
  unit: string;
  remarks?: string;
  addedBy: string;
  allocatedQuantity?: number;
  remainingQuantity?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrderSpecDetail {
  id: string;
  ticketId: string;
  specMasterId: string;
  specMaster?: WorkOrderSpecMaster;
  quantity: number;
  unit: string;
  remarks?: string;
  addedBy: string;
  allocatedQuantity?: number;
  remainingQuantity?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrderItemAllocation {
  id: string;
  itemDetailId: string;
  workflowStepId: string;
  allocatedQuantity: number;
  allocatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrderSpecAllocation {
  id: string;
  specDetailId: string;
  workflowStepId: string;
  allocatedQuantity: number;
  allocatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
