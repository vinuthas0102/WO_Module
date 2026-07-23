import snapshotData from '../data/snapshot.json';

type Row = Record<string, any>;
type Operator = 'eq' | 'neq' | 'in' | 'ilike' | 'is' | 'gt' | 'gte' | 'lt' | 'lte';

interface Filter {
  column: string;
  operator: Operator;
  value: any;
}

const STORAGE_KEY = 'tracksphere-offline-data';

function loadSnapshot(): Record<string, Row[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  const data: Record<string, Row[]> = {};
  for (const [key, value] of Object.entries(snapshotData as Record<string, any>)) {
    data[key] = [...(value as Row[])];
  }
  return data;
}

let data: Record<string, Row[]> = loadSnapshot();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function matchFilter(row: Row, filter: Filter): boolean {
  const val = row[filter.column];
  switch (filter.operator) {
    case 'eq': return val === filter.value;
    case 'neq': return val !== filter.value;
    case 'in': return Array.isArray(filter.value) && filter.value.includes(val);
    case 'ilike':
      if (val == null) return false;
      return String(val).toLowerCase().includes(String(filter.value).toLowerCase().replace(/%/g, ''));
    case 'is':
      if (filter.value === null) return val === null || val === undefined;
      return val === filter.value;
    case 'gt': return val != null && val > filter.value;
    case 'gte': return val != null && val >= filter.value;
    case 'lt': return val != null && val < filter.value;
    case 'lte': return val != null && val <= filter.value;
    default: return true;
  }
}

function applyFilters(rows: Row[], filters: Filter[]): Row[] {
  return filters.reduce((acc, f) => acc.filter(r => matchFilter(r, f)), rows);
}

function applyOrder(rows: Row[], orders: { column: string; ascending: boolean }[]): Row[] {
  if (orders.length === 0) return rows;
  return [...rows].sort((a, b) => {
    for (const ord of orders) {
      const av = a[ord.column];
      const bv = b[ord.column];
      if (av === bv) continue;
      const cmp = av == null ? -1 : bv == null ? 1 : av < bv ? -1 : 1;
      return ord.ascending ? cmp : -cmp;
    }
    return 0;
  });
}

function applySelect(rows: Row[], selectStr: string): Row[] {
  if (!selectStr || selectStr === '*') return rows;

  // Handle join syntax: "*, related_table(*)"
  const joinMatch = selectStr.match(/\*,\s*(\w+)\(([^)]*)\)/);
  if (joinMatch) {
    const foreignTable = joinMatch[1];
    const foreignSelect = joinMatch[2] || '*';
    const foreignRows = data[foreignTable] || [];
    return rows.map(row => {
      const result = { ...row };
      // Try to find related rows by common FK patterns
      const fkPatterns = [
        { local: 'id', foreign: 'ticket_id' },
        { local: 'id', foreign: 'step_id' },
        { local: 'id', foreign: 'audit_log_id' },
        { local: 'id', foreign: 'allocation_id' },
        { local: 'id', foreign: 'ticket_id' },
      ];
      for (const pattern of fkPatterns) {
        const related = foreignRows.filter(fr => fr[pattern.foreign] === row[pattern.local]);
        if (related.length > 0) {
          if (foreignSelect === '*') {
            result[foreignTable] = related;
          } else {
            result[foreignTable] = related.map(r => {
              const filtered: Row = {};
              for (const col of foreignSelect.split(',')) {
                const trimmed = col.trim();
                if (trimmed in r) filtered[trimmed] = r[trimmed];
              }
              return filtered;
            });
          }
          break;
        }
      }
      return result;
    });
  }

  // Simple column selection
  const columns = selectStr.split(',').map(s => s.trim());
  if (columns.length === 1 && columns[0] === '*') return rows;
  return rows.map(row => {
    const result: Row = {};
    for (const col of columns) {
      if (col in row) result[col] = row[col];
    }
    return result;
  });
}

class MockQueryBuilder {
  private tableName: string;
  private filters: Filter[] = [];
  private orders: { column: string; ascending: boolean }[] = [];
  private limitCount: number | null = null;
  private selectStr: string = '*';
  private isSingle = false;
  private isMaybeSingle = false;
  private countMode: 'exact' | 'estimated' | null = null;
  private headOnly = false;

  constructor(table: string) {
    this.tableName = table;
  }

  select(columns: string = '*') {
    this.selectStr = columns;
    return this;
  }

  eq(column: string, value: any) { this.filters.push({ column, operator: 'eq', value }); return this; }
  neq(column: string, value: any) { this.filters.push({ column, operator: 'neq', value }); return this; }
  in(column: string, value: any[]) { this.filters.push({ column, operator: 'in', value }); return this; }
  ilike(column: string, value: string) { this.filters.push({ column, operator: 'ilike', value }); return this; }
  is(column: string, value: any) { this.filters.push({ column, operator: 'is', value }); return this; }
  gt(column: string, value: any) { this.filters.push({ column, operator: 'gt', value }); return this; }
  gte(column: string, value: any) { this.filters.push({ column, operator: 'gte', value }); return this; }
  lt(column: string, value: any) { this.filters.push({ column, operator: 'lt', value }); return this; }
  lte(column: string, value: any) { this.filters.push({ column, operator: 'lte', value }); return this; }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  limit(count: number) { this.limitCount = count; return this; }
  single() { this.isSingle = true; return this; }
  maybeSingle() { this.isMaybeSingle = true; return this; }

  insert(rows: Row | Row[]) {
    const rowsArray = Array.isArray(rows) ? rows : [rows];
    const tableRows = data[this.tableName] || [];
    const inserted = rowsArray.map(r => ({
      id: r.id || generateId(),
      created_at: r.created_at || new Date().toISOString(),
      updated_at: r.updated_at || new Date().toISOString(),
      ...r,
    }));
    data[this.tableName] = [...tableRows, ...inserted];
    persist();
    this._insertedData = inserted;
    return this;
  }

  private _insertedData: Row[] | null = null;

  update(updates: Row) {
    this._updateData = updates;
    return this;
  }

  private _updateData: Row | null = null;

  delete() {
    this._isDelete = true;
    return this;
  }

  private _isDelete = false;

  count(options: { count: 'exact' | 'estimated'; head?: boolean }) {
    this.countMode = options.count;
    this.headOnly = options.head ?? false;
    return this;
  }

  range(from: number, to: number) {
    this.limitCount = to - from + 1;
    return this;
  }

  async then(resolve: any, reject: any) {
    try {
      const result = await this.execute();
      resolve(result);
    } catch (err) {
      reject(err);
    }
  }

  private async execute() {
    const tableRows = data[this.tableName] || [];

    // Handle insert
    if (this._insertedData) {
      return { data: this._insertedData, error: null, count: this._insertedData.length };
    }

    // Handle update
    if (this._updateData) {
      let matched = applyFilters(tableRows, this.filters);
      const updated = matched.map(row => ({
        ...row,
        ...this._updateData,
        updated_at: new Date().toISOString(),
      }));
      data[this.tableName] = tableRows.map(row => {
        const upd = updated.find(u => u.id === row.id);
        return upd || row;
      });
      persist();
      return { data: updated, error: null, count: updated.length };
    }

    // Handle delete
    if (this._isDelete) {
      const matched = applyFilters(tableRows, this.filters);
      const matchedIds = new Set(matched.map(r => r.id));
      data[this.tableName] = tableRows.filter(r => !matchedIds.has(r.id));
      persist();
      return { data: null, error: null, count: matched.length };
    }

    // Handle select
    let result = applyFilters(tableRows, this.filters);
    result = applyOrder(result, this.orders);
    if (this.limitCount !== null) result = result.slice(0, this.limitCount);
    result = applySelect(result, this.selectStr);

    if (this.countMode && this.headOnly) {
      return { data: null, error: null, count: result.length };
    }

    if (this.isSingle) {
      if (result.length === 0) {
        return { data: null, error: { code: 'PGRST116', message: 'JSON object requested,too (single) but too many rows returned' } };
      }
      return { data: result[0], error: null, count: 1 };
    }

    if (this.isMaybeSingle) {
      return { data: result[0] || null, error: null, count: result.length };
    }

    return { data: result, error: null, count: result.length };
  }
}

class MockStorageBucket {
  private bucket: string;
  private storageKey = 'tracksphere-offline-storage';

  constructor(bucket: string) { this.bucket = bucket; }

  async upload(path: string, file: File | Blob | ArrayBuffer) {
    try {
      const store = this.getStore();
      let fileData: string;
      if (file instanceof File || file instanceof Blob) {
        fileData = await fileToBase64(file);
      } else {
        fileData = btoa(String.fromCharCode(...new Uint8Array(file)));
      }
      store[`${this.bucket}/${path}`] = fileData;
      localStorage.setItem(this.storageKey, JSON.stringify(store));
      return { data: { path }, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  }

  async download(path: string) {
    const store = this.getStore();
    const key = `${this.bucket}/${path}`;
    if (!store[key]) return { data: null, error: { message: 'File not found' } };
    const byteChars = atob(store[key]);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
    return { data: bytes.buffer, error: null };
  }

  async remove(paths: string[]) {
    const store = this.getStore();
    for (const p of paths) delete store[`${this.bucket}/${p}`];
    localStorage.setItem(this.storageKey, JSON.stringify(store));
    return { data: paths, error: null };
  }

  getPublicUrl(path: string) {
    return { data: { publicUrl: `offline://${this.bucket}/${path}` } };
  }

  private getStore(): Record<string, string> {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    } catch { return {}; }
  }
}

function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function handleRpc(fn: string, params: any): any {
  switch (fn) {
    case 'get_accessible_ticket_ids_for_user': {
      const userId = params.p_user_id;
      const tickets = data['tickets'] || [];
      const steps = data['workflow_steps'] || [];
      const assignedTicketIds = new Set(steps.filter(s => s.assigned_to === userId).map(s => s.ticket_id));
      const createdTicketIds = new Set(tickets.filter(t => t.created_by === userId).map(t => t.id));
      return [...new Set([...assignedTicketIds, ...createdTicketIds])];
    }
    case 'can_user_access_ticket': {
      const userId = params.p_user_id;
      const ticketId = params.p_ticket_id;
      const tickets = data['tickets'] || [];
      const steps = data['workflow_steps'] || [];
      if (tickets.some(t => t.id === ticketId && t.created_by === userId)) return true;
      if (steps.some(s => s.ticket_id === ticketId && s.assigned_to === userId)) return true;
      return false;
    }
    case 'get_next_bill_number': {
      const bills = data['bills'] || [];
      return `BILL-${String(bills.length + 1).padStart(4, '0')}`;
    }
    case 'get_next_mbook_number': {
      const entries = data['measurement_book_entries'] || [];
      const ticketEntries = entries.filter((e: any) => e.ticket_id === params.p_ticket_id);
      return `MBK-${String(ticketEntries.length + 1).padStart(3, '0')}`;
    }
    case 'get_next_entry_number': {
      const entries = data['workflow_step_progress_tracking'] || [];
      const stepEntries = entries.filter((e: any) => e.step_id === params.p_step_id);
      return stepEntries.length + 1;
    }
    case 'get_next_spec_progress_entry_number': {
      const entries = data['spec_allocation_progress_tracking'] || [];
      const allocEntries = entries.filter((e: any) => e.allocation_id === params.p_allocation_id);
      return allocEntries.length + 1;
    }
    case 'calculate_workflow_step_progress': {
      const stepId = params.p_step_id;
      const steps = data['workflow_steps'] || [];
      const step = steps.find(s => s.id === stepId);
      return step?.progress || 0;
    }
    case 'check_mandatory_file_references_complete': {
      return true;
    }
    case 'log_user_management_action': {
      const audit = data['user_management_audit'] || [];
      const entry = {
        id: generateId(),
        action: params.p_action,
        target_user_id: params.p_target_user_id || null,
        performed_by: params.p_performed_by || null,
        details: params.p_details || null,
        created_at: new Date().toISOString(),
      };
      data['user_management_audit'] = [...audit, entry];
      persist();
      return true;
    }
    case 'exec': return null;
    default:
      console.warn(`Unknown RPC: ${fn}`);
      return null;
  }
}

export function createMockSupabaseClient() {
  return {
    from(table: string) {
      return new MockQueryBuilder(table);
    },
    rpc(fn: string, params?: any) {
      return Promise.resolve({ data: handleRpc(fn, params || {}), error: null });
    },
    storage: {
      from(bucket: string) {
        return new MockStorageBucket(bucket);
      },
    },
    channel() {
      return {
        on() { return this; },
        subscribe(cb?: any) { if (cb) setTimeout(() => cb('SUBSCRIBED'), 0); return this; },
        unsubscribe() { return Promise.resolve(); },
      };
    },
    auth: {
      getSession() { return Promise.resolve({ data: { session: null }, error: null }); },
      onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
    },
  } as any;
}
