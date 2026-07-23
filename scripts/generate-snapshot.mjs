import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rrkniuhpymvcbczqldqs.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJya25pdWhweW12Y2JjenFsZHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTQ2OTEsImV4cCI6MjA3OTM3MDY5MX0.YeDR7aR5oASCeSU1qRlZQ69Y_FSQBkjQZkR0V__sk-s';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tables = [
  'users',
  'modules',
  'tickets',
  'workflow_steps',
  'workflow_step_dependencies',
  'workflow_comments',
  'audit_logs',
  'documents',
  'workflow_step_progress_documents',
  'workflow_step_progress_tracking',
  'workflow_step_field_values',
  'workflow_step_file_references',
  'clarification_threads',
  'clarification_messages',
  'clarification_attachments',
  'clarification_notification_log',
  'field_definitions',
  'field_dropdown_options',
  'module_field_configurations',
  'ticket_field_values',
  'file_reference_templates',
  'file_attachments',
  'work_order_items_master',
  'work_order_item_details',
  'work_order_item_allocations',
  'work_order_specs_master',
  'work_order_spec_details',
  'work_order_spec_allocations',
  'spec_allocation_progress_tracking',
  'spec_allocation_progress_documents',
  'measurement_book_entries',
  'bills',
  'bill_mbook_entries',
  'ticket_user_notes',
  'user_display_preferences',
  'user_activity_logs',
  'user_management_audit',
];

async function fetchTable(name) {
  const { data, error } = await supabase.from(name).select('*').limit(10000);
  if (error) {
    console.warn(`  ${name}: error - ${error.message}`);
    return [];
  }
  console.log(`  ${name}: ${data?.length || 0} rows`);
  return data || [];
}

async function main() {
  console.log('Generating data snapshot from Supabase...');
  console.log(`URL: ${supabaseUrl}`);

  const snapshot = {};
  for (const table of tables) {
    snapshot[table] = await fetchTable(table);
  }

  const outputPath = join(projectRoot, 'src', 'data', 'snapshot.json');
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(snapshot, null, 2));
  const sizeKB = (Buffer.byteLength(JSON.stringify(snapshot)) / 1024).toFixed(1);
  console.log(`\nSnapshot saved to ${outputPath} (${sizeKB} KB)`);
}

main().catch(err => {
  console.error('Snapshot generation failed:', err);
  process.exit(1);
});
