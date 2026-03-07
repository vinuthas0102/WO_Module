# Demo User Credentials

This document provides login credentials for testing the TrackSphere demo environment.

## Access URL

**Demo Environment:** https://womodule.bolt.host

---

## Available Test Accounts

### Administrator Account
Full system access with all privileges including user management and system configuration.

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| Executive Officer (EO) | `admin` | `admin` | Full administrative access |

### Department Officer (DO) Managers
Task-based access - can only view tickets where they have assigned workflow tasks.

| Role | Username | Password | Department |
|------|----------|----------|------------|
| DO Manager - IT | `do.it` | `do.it` | Information Technology |
| DO Manager - HR | `do.hr` | `do.hr` | Human Resources |
| DO Manager - Finance | `do.finance` | `do.finance` | Finance |
| DO Manager - Operations | `do.operations` | `do.operations` | Operations |
| DO Manager - Maintenance | `do.maintenance` | `do.maintenance` | Maintenance |

### Finance Officer
Specialized access for financial approval workflows and billing processes.

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| Finance Officer | `finance.officer` | `finance123` | Finance approval workflows |

### Regular Employees
Standard user access for creating tickets and tracking work progress.

| Role | Username | Password | Department |
|------|----------|----------|------------|
| Employee - IT | `user` | `user` | Information Technology |
| Employee - HR | `jane.doe` | `password` | Human Resources |

---

## Important Notes

1. **Demo Environment Only**: This is a demonstration environment for internal team review. All credentials are for testing purposes only.

2. **Data Persistence**: All data changes are stored in the connected Supabase database. Data will persist across sessions but should be considered temporary demo data.

3. **Role-Based Access**: Different user roles have different levels of access:
   - **EO (Admin)**: Full system access
   - **DO Managers**: Can only see tickets where they have assigned tasks
   - **Finance Officer**: Access to finance approval workflows
   - **Employees**: Standard access for ticket creation and progress tracking

4. **Security Notice**: These credentials are publicly visible in this demo environment. Never use these patterns in production.

---

## Testing Scenarios

### Scenario 1: Full Workflow (Use EO account)
1. Login as `admin` / `admin`
2. Create a new ticket in the Work Order Management module
3. Add workflow steps with different department assignments
4. Test step dependencies and progress tracking
5. Review audit trail and clarification features

### Scenario 2: Department Manager View (Use DO account)
1. Login as `do.it` / `do.it`
2. View only tickets where IT department has assigned tasks
3. Test task-based visibility restrictions
4. Update workflow step progress

### Scenario 3: Finance Approval Flow (Use Finance Officer account)
1. Login as `finance.officer` / `finance123`
2. Navigate to tickets with finance approval requests
3. Test approval/rejection workflows
4. Review measurement books and billing

### Scenario 4: Employee Experience (Use Employee account)
1. Login as `user` / `user`
2. Create a new ticket
3. Track ticket progress
4. Add personal notes
5. Initiate clarification threads

---

## Support

For questions or issues with the demo environment:
- Contact the development team
- Refer to the TEAM_ACCESS_GUIDE.md for detailed feature testing instructions
