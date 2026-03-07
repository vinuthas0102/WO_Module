# Team Access and Testing Guide

This guide helps team members access and test the TrackSphere demo environment effectively.

## Quick Start

1. **Access the Demo**: Navigate to https://womodule.bolt.host
2. **Login**: Use any credentials from DEMO_CREDENTIALS.md
3. **Select Module**: Choose "Work Order Management" module
4. **Start Testing**: Follow the testing scenarios below

---

## Demo Environment Overview

### What is This Demo?

This is a fully functional demonstration of the TrackSphere workflow management system, deployed specifically for internal team review and feedback collection.

### Key Characteristics

- **Demo Environment Badge**: Orange banner indicates this is not production
- **Real Database**: Connected to Supabase with persistent data storage
- **Full Features**: All system features are available for testing
- **Sample Data**: Pre-loaded with example tickets and workflows
- **Safe Testing**: Feel free to create, modify, and delete test data

### Not for Production

This demo environment is:
- For internal testing and review only
- Not suitable for real business operations
- Using simplified security appropriate for demonstration
- Subject to data resets between testing sessions

---

## Available Features for Testing

### Core Workflow Features

1. **Ticket Management**
   - Create new tickets
   - View ticket list and details
   - Update ticket status and assignments
   - Track ticket progress

2. **Workflow Steps**
   - Create hierarchical workflow structures
   - Define step dependencies
   - Assign steps to different departments
   - Track step-by-step progress

3. **Work Order Management**
   - Add work order specifications
   - Allocate specs to workflow steps
   - Track spec-wise progress
   - Auto-calculate workflow progress from specs

4. **Document Management**
   - Upload step documents
   - Track progress documents
   - File reference templates
   - Document audit trails

5. **Clarification System**
   - Create clarification threads
   - Chat-style messaging
   - Thread status management
   - Notification tracking (demo mode)

6. **Finance Module**
   - Finance approval workflows
   - Measurement book entries
   - Bill generation and tracking
   - Approval routing

7. **Progress Tracking**
   - Manual progress updates
   - Auto-calculated progress from specs
   - Progress history view
   - Cumulative progress tracking

8. **Audit Trail**
   - Comprehensive activity logging
   - User action tracking
   - Change history
   - Document upload tracking

---

## Testing Workflows

### Workflow 1: Complete Ticket Lifecycle

**User:** EO (admin/admin)

1. Create a new ticket
2. Add multiple workflow steps with hierarchy
3. Assign steps to different departments
4. Add file reference requirements
5. Track progress through completion
6. Review audit trail

**Expected Outcome:** Full ticket lifecycle with proper tracking and audit trail

### Workflow 2: Department Manager Visibility

**Users:** Multiple DO accounts

1. Login as `do.it` / `do.it`
2. Observe: Only sees tickets with IT department assignments
3. Login as `do.hr` / `do.hr`
4. Observe: Different set of tickets based on HR assignments
5. Verify task-based visibility

**Expected Outcome:** Each DO manager sees only relevant tickets

### Workflow 3: Spec-Based Progress

**User:** Employee or EO

1. Open a ticket with work order specs
2. Allocate specs to workflow steps
3. Submit spec progress entries
4. Verify auto-calculation of workflow progress
5. Check cumulative tracking

**Expected Outcome:** Workflow progress automatically updates from spec completion

### Workflow 4: Clarification Flow

**Users:** Multiple users

1. Create a clarification thread on a workflow step
2. Assign to another user
3. Login as assigned user
4. Reply to the thread
5. Mark as resolved
6. Review notification log

**Expected Outcome:** Complete clarification lifecycle with proper routing

### Workflow 5: Finance Approval

**Users:** Employee + Finance Officer

1. Create ticket with financial components
2. Submit for finance approval
3. Login as `finance.officer` / `finance123`
4. Review approval request
5. Approve or reject with remarks
6. Track approval status

**Expected Outcome:** Complete finance approval workflow

---

## Role-Specific Testing

### Testing as Executive Officer (EO)

**Login:** admin / admin

**Focus Areas:**
- User management (create, edit, disable users)
- Module configuration
- Field configuration
- File reference templates
- Complete system visibility
- Admin-only actions

**Key Features to Test:**
- Bulk ticket creation
- Bulk step creation
- Dependency management
- Template management
- System-wide reports

### Testing as Department Officer (DO)

**Login:** Any do.* account

**Focus Areas:**
- Task-based ticket visibility
- Step updates for assigned tasks
- Progress tracking
- Document uploads
- Clarification responses

**Key Features to Test:**
- Limited ticket visibility
- Step assignment functionality
- Progress submission
- Document management

### Testing as Finance Officer

**Login:** finance.officer / finance123

**Focus Areas:**
- Finance approval queue
- Measurement book management
- Bill processing
- Approval workflows

**Key Features to Test:**
- Approval actions
- Remarks and comments
- Document review
- Bill generation

### Testing as Employee

**Login:** user / user OR jane.doe / password

**Focus Areas:**
- Ticket creation
- Progress updates
- Document uploads
- Personal notes
- Clarification initiation

**Key Features to Test:**
- Ticket creation flow
- Progress tracking
- Note-taking
- Clarification system

---

## Feature-Specific Testing

### Testing Progress Tracking

1. **Manual Progress Updates**
   - Open a workflow step
   - Use the progress slider or input
   - Add comments
   - Submit progress update
   - Verify history tracking

2. **Auto-Calculated Progress**
   - Allocate specs to a step
   - Submit spec progress entries
   - Observe automatic workflow progress calculation
   - Verify cumulative tracking

### Testing File Management

1. **Upload Documents**
   - Navigate to a workflow step
   - Upload progress documents
   - Verify storage and retrieval
   - Check audit trail entry

2. **File Reference Templates**
   - Create file reference template (EO only)
   - Apply template to workflow step
   - Upload required files
   - Track completion status

### Testing Clarifications

1. **Create Thread**
   - Click clarification icon on step
   - Enter subject and message
   - Assign to user
   - Submit

2. **Respond to Thread**
   - Login as assigned user
   - View clarification
   - Reply with message
   - Mark as resolved

3. **Admin Actions**
   - Complete thread
   - Close thread
   - Cancel thread with reason

---

## Feedback Collection

### What to Look For

1. **Usability**
   - Is the workflow intuitive?
   - Are features easy to find and use?
   - Is navigation smooth?

2. **Functionality**
   - Do features work as expected?
   - Are there any errors or bugs?
   - Is data persisting correctly?

3. **Design**
   - Is the interface visually appealing?
   - Is information well-organized?
   - Are colors and layouts appropriate?

4. **Performance**
   - Is the application responsive?
   - Do pages load quickly?
   - Are there any delays or lag?

### How to Provide Feedback

**Option 1: Direct Communication**
- Email the development team with your observations
- Include screenshots for visual issues
- Describe steps to reproduce any problems

**Option 2: Structured Feedback**

For each issue or suggestion, provide:
1. **Feature/Area**: Which part of the system
2. **Issue Description**: What's not working or could be improved
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What's happening instead
5. **Steps to Reproduce**: How to see the issue
6. **Priority**: High/Medium/Low
7. **User Role**: Which role you were testing as

**Example Feedback:**
```
Feature: Workflow Step Creation
Issue: Cannot assign multiple users to one step
Expected: Ability to assign multiple users
Actual: Only one user can be selected
Steps: Create ticket > Add step > Try to assign multiple users
Priority: Medium
Role: EO (admin)
```

---

## Common Questions

### Q: Can I delete data I created?
**A:** Yes, feel free to create and delete test data. The demo environment is designed for experimentation.

### Q: Will my test data affect others?
**A:** Yes, this is a shared demo environment. All team members see the same data.

### Q: How often is data reset?
**A:** Data persists across sessions. Resets will be communicated to the team.

### Q: What if I encounter an error?
**A:** Note the error message, the steps you took, and your user role. Report it to the development team.

### Q: Can I test with multiple users simultaneously?
**A:** Yes, open multiple browser windows or use incognito mode to test multi-user scenarios.

### Q: Are notifications actually sent?
**A:** No, notifications are logged in demo mode but not actually sent. This is indicated in the UI.

---

## Known Limitations

1. **Email Notifications**: Logged but not sent (demo mode)
2. **Real-Time Updates**: Requires page refresh to see changes by other users
3. **Data Volume**: Performance tested with moderate data volumes
4. **Security**: Simplified security model appropriate for demo only

---

## Next Steps After Demo

Once stakeholder feedback is collected and the demo is approved:

1. Development team will implement requested changes
2. System will be deployed to local/production environment
3. Production-grade security will be implemented
4. User data isolation and proper authentication will be added
5. Real notification system will be configured
6. Production data migration will occur

---

## Support Contacts

For technical issues or questions about the demo:
- **Development Team**: [Your contact information]
- **Project Lead**: [Your contact information]

---

**Last Updated:** March 7, 2026

**Demo Version:** 1.0

**Deployment:** https://womodule.bolt.host
