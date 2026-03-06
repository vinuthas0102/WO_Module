# Ticket Tracker Application

A comprehensive, production-ready ticket tracking system built with React, TypeScript, and Supabase. The application supports role-based access control, multi-module configuration, complete ticket lifecycle management, work order tracking, finance approval workflows, and real-time data persistence.

## Features

### Core Modules
- **Ticket Management**: Create, view, edit, and delete tickets with enforced status lifecycle
- **Workflow Steps (Step Management)**: Hierarchical, multi-level workflow steps with progress tracking, dependency management, and file attachments
- **Audit Trail**: Immutable history of every action with document attachments and progress documents
- **Finance Approvals**: Send-to-finance flow with officer assignment, approval/rejection, and document upload
- **Clarifications (Chat Log)**: Per-step clarification threads with multi-channel notifications (SMS, Email, WhatsApp)
- **Spec Allocation & Progress Tracking**: Allocate specifications and items to workflow steps and track quantity-based progress
- **Measurement Book**: Record and manage measurement book entries linked to workflow steps
- **Billing**: Bill management tied to work order specs and measurement entries
- **My Notes**: Private per-user notes on individual tickets

### Modules Supported
The application is multi-module. Each module has its own terminology and configuration. The current seed data includes a Work Order module with full WO-specific features (Items Master, Specs Master, WO allocation tabs).

### Role-Based Access Control
- **Employee**: Can view and manage their own tickets
- **Department Officer (DO)**: Can manage all tickets visible within their department scope
- **Executive Officer (EO)**: Full access to all tickets, admin setup, user management, field configuration, file reference templates, and master data
- **Vendor**: Limited access for external contributors
- **Finance**: Access to finance approval workflows

### Ticket Status Lifecycle
```
DRAFT → CREATED → ACTIVE → SENT_TO_FINANCE → APPROVED_BY_FINANCE → COMPLETED → CLOSED
                          ↘ CANCELLED
                          ↘ REJECTED_BY_FINANCE
```

### Workflow Step Status
```
NOT_STARTED → WIP → COMPLETED → CLOSED
```

### Admin Features (EO only)
- User Management (create, edit, deactivate users)
- Field Configuration (add custom fields per module per context)
- File Reference Template Manager
- Work Order Items Master
- Work Order Specs Master
- Display Preferences (icon layout, icon size, show labels)

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite 5
- **Styling**: Tailwind CSS + Lucide React Icons
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth (email/password)
- **State Management**: React Context API (AuthContext, TicketContext, NotificationContext, NavigationContext)
- **File Storage**: Supabase Storage (step-documents, workflow-progress-documents, finance-approval-documents)
- **Build Tool**: Vite with manual chunk splitting (react-vendor, supabase-vendor, utils-vendor)

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd ticket-tracker
npm install
```

### 2. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run all migration files in the `supabase/migrations/` directory in chronological order
4. The migrations create all tables, RLS policies, storage buckets, and seed data automatically

### 3. Environment Configuration

Copy and fill in your environment variables:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: override auto-detection
# VITE_APP_MODE=database   # 'database' | 'demo'  (auto-detected if omitted)
# VITE_AUTH_MODE=database  # 'database' | 'mock'  (follows APP_MODE if omitted)
# VITE_ENABLE_LOGGING=false
```

You can find `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your Supabase project settings under API.

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Sample User Accounts

The application comes with pre-configured sample users from the seed migration:

| Role | Username | Password | Department |
|------|----------|----------|------------|
| Executive Officer | admin | admin | ADMINISTRATION |
| Department Officer | manager | manager | IT |
| Employee | user | user | IT |
| Employee | jane.doe | password | HR |
| Department Officer | hr.manager | hrpass | HR |
| Finance Officer | finance.officer | finance | FINANCE |
| Department Officer | finance.manager | financepass | FINANCE |
| Vendor | vendor | vendor | EXTERNAL |

## Database Schema

### Core Tables

| Table | Purpose |
|---|---|
| `users` | User accounts, roles, departments |
| `modules` | Application modules with schema and config |
| `tickets` | Main ticket records |
| `workflow_steps` | Hierarchical workflow steps per ticket |
| `workflow_step_dependencies` | Step dependency relationships |
| `workflow_step_file_references` | File reference assignments per step |
| `file_reference_templates` | Admin-defined file reference template sets |
| `documents` | Step and ticket file attachments |
| `workflow_step_progress_documents` | Progress update document attachments |
| `audit_logs` | Immutable audit trail |
| `clarification_threads` | Per-step clarification threads |
| `clarification_messages` | Messages within threads |
| `clarification_message_attachments` | Message file attachments |
| `finance_approvals` | Finance approval records |
| `finance_approval_documents` | Finance decision documents |
| `work_order_item_master` | Work order item catalogue |
| `work_order_spec_master` | Work order specification catalogue |
| `work_order_item_details` | Items allocated to a ticket |
| `work_order_spec_details` | Specs allocated to a ticket |
| `work_order_item_allocations` | Item allocations per workflow step |
| `work_order_spec_allocations` | Spec allocations per workflow step |
| `spec_allocation_progress` | Quantity progress entries for spec allocations |
| `measurement_book_entries` | Measurement book records |
| `billing_entries` | Billing entries per spec/measurement |
| `module_field_configurations` | Dynamic field definitions per module |
| `field_dropdown_options` | Options for dropdown fields |
| `ticket_field_values` | Dynamic field values for tickets |
| `workflow_step_field_values` | Dynamic field values for steps |
| `user_display_preferences` | Per-user icon and layout preferences |
| `ticket_user_notes` | Private per-user notes per ticket |
| `progress_tracking` | Step progress tracking entries |

### Security

- Row Level Security (RLS) enabled on all tables
- Role-based policies: users access only their authorized data
- Foreign key constraints enforce referential integrity
- Audit logging captures all state changes immutably

## Application Structure

```
src/
├── App.tsx                      # App shell with provider wrapping
├── components/
│   ├── admin/                   # FieldConfigurationManager, UserManagementPage,
│   │                            #   FileReferenceTemplateManager, ItemMasterManager,
│   │                            #   SpecMasterManager, UserPreferencesPage
│   ├── auth/                    # LoginForm, ModuleSelection
│   ├── clarification/           # ClarificationThreadView, ChatLogTab, NewClarificationForm,
│   │                            #   ClarificationMessageBubble, ActionConfirmationModal
│   ├── common/                  # CollapsibleFilterPanel, Breadcrumb, ErrorBoundary,
│   │                            #   LoadingSpinner, NotificationPanel, TopRightControls
│   ├── dashboard/               # DashboardPage, StatusCards, SearchPanel,
│   │                            #   TicketCard, TicketGrid, TicketTable
│   ├── iconDisplay/             # IconDisplayWrapper and display strategy components
│   ├── landing/                 # LandingPage
│   ├── layout/                  # Header
│   └── ticket/                  # TicketView, StepManagement (WorkflowManagement),
│                                #   AuditTrail, AuditEntryItem, BillManager,
│                                #   MeasurementBookManager, FinanceApprovalActions,
│                                #   ProgressHistoryView, TrackProgressSection, and more
├── context/
│   ├── AuthContext.tsx           # Authentication state, module selection
│   ├── TicketContext.tsx         # Tickets, users, CRUD operations
│   ├── NotificationContext.tsx   # In-app notification toasts
│   └── NavigationContext.tsx     # Cross-component navigation (e.g., open ticket from notification)
├── lib/
│   ├── supabase.ts               # Supabase client singleton
│   ├── utils.ts                  # Shared helpers, module terminology
│   ├── environment.ts            # Mode detection (database vs demo)
│   ├── hierarchyColors.ts        # Workflow step hierarchy color system
│   ├── diagnostics.ts            # Dev-mode connectivity diagnostics
│   └── logger.ts                 # Structured logging utility
├── services/
│   ├── ticketService.ts          # Ticket CRUD, status transitions, workflow step operations
│   ├── fileService.ts            # Document upload, download, deletion, signed URLs
│   ├── progressHistoryService.ts # Step progress history aggregation (extracted)
│   ├── authService.ts            # Authentication and session handling
│   ├── clarificationService.ts   # Clarification threads and messages
│   ├── dependencyService.ts      # Step dependency creation and validation
│   ├── fieldConfigService.ts     # Module field configuration
│   ├── fieldValueService.ts      # Dynamic field value persistence
│   ├── fileReferenceService.ts   # File reference template operations
│   ├── financeApprovalService.ts # Finance approval workflow
│   ├── measurementBookService.ts # Measurement book entries
│   ├── billingService.ts         # Billing entries
│   ├── progressTrackingService.ts# Step progress tracking
│   ├── specAllocationProgressService.ts # Spec quantity progress
│   ├── workOrderItemService.ts   # WO item master and allocations
│   ├── workOrderSpecService.ts   # WO spec master and allocations
│   ├── userManagementService.ts  # Admin user management
│   ├── userPreferencesService.ts # Display preferences
│   ├── notificationService.ts    # Notification channels
│   ├── ticketNotesService.ts     # Private user notes
│   ├── actionIconRegistry.ts     # Action icon registry
│   └── htmlExportService.ts      # HTML/ZIP export
└── types/
    ├── index.ts                  # Barrel re-export (all types)
    ├── user.types.ts             # User, Module
    ├── ticket.types.ts           # Ticket, TicketStatus, AuditEntry, BulkTicketInput
    ├── workflow.types.ts         # WorkflowStep, WorkflowStepStatus, BulkStepInput
    ├── file.types.ts             # FileAttachment, FileReferenceTemplate
    ├── field.types.ts            # FieldDefinition, ModuleFieldConfiguration, DynamicFieldProps
    ├── finance.types.ts          # FinanceApproval, FinanceApprovalStatus
    ├── workorder.types.ts        # WorkOrderItemMaster, WorkOrderSpecMaster, allocations
    ├── clarification.types.ts    # ClarificationThread, ClarificationMessage, NotificationChannel
    └── ui.types.ts               # ActionIconDefinition, UserDisplayPreferences, DisplayMode
```

## Known Build Warnings (Non-Blocking)

- `diagnostics.ts` uses a dynamic `import('./supabase')` intentionally for lazy dev-only loading
- `App.tsx` uses a dynamic `import('./lib/diagnostics')` intentionally so diagnostics never load in production
- `BillManager.tsx`, `MBookTabContent.tsx`, and `MeasurementBookManager.tsx` use dynamic `import('../../lib/supabase')` for lazy loading inside event handlers

## Deployment

### Production Build

```bash
npm run build
```

Output is in `dist/`. The `public/_redirects` file configures SPA routing for Netlify/Vercel.

### Deployment Platforms

The output is a static SPA and can be deployed to any static host:
- Netlify
- Vercel
- AWS S3 + CloudFront

## Security Considerations

- All database access goes through Supabase with parameterized queries
- Row Level Security enforced at the database layer — unauthorized rows are never returned
- File uploads are stored in private Supabase Storage buckets with signed URL access
- Secrets are never exposed in client-side code (only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are public by design in Supabase's architecture)

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
   - Check RLS policies are applied — run all migration files in order
   - Open browser console; `checkDatabaseConnection()` runs automatically in dev mode

2. **Authentication Issues**
   - Verify credentials match the seeded users
   - Check that the seed migration (`02_seed_default_data.sql`) ran successfully
   - Ensure the Supabase project is not paused

3. **Permission Errors**
   - Verify RLS policy migrations ran (especially `fix_*` migration files)
   - Check user role assignment in the `users` table

## License

This project is licensed under the MIT License - see the LICENSE file for details.
