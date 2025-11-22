# User Management System - Complete Guide

## Overview

The User Management System provides comprehensive administrative capabilities for managing system users, roles, and permissions. This system is accessible exclusively to Executive Officers (EO) and integrates seamlessly with the existing authentication and authorization infrastructure.

## Features Implemented

### 1. User CRUD Operations

- **Create User**: Generate new user accounts with automatic secure password generation
- **Update User**: Modify user details including name, email, role, and department
- **Delete User**: Soft delete users by deactivating their accounts
- **View User Details**: Access complete user profiles with activity history

### 2. User Status Management

- **Enable/Disable Users**: Activate or deactivate user accounts
- **Account Status Tracking**: Real-time status display with visual indicators
- **Soft Delete**: Preserve user data while preventing login access

### 3. Password Management

- **Automatic Password Generation**: Secure 12-character passwords with complexity requirements
- **Temporary Password Display**: On-screen display with copy-to-clipboard functionality
- **Password Expiration**: 30-day expiration for initial passwords, 7-day for resets
- **Password Reset**: Administrative password reset capability

### 4. Role-Based Access Control

- **Role Assignment**: Assign and modify user roles
- **Available Roles**:
  - Employee: Standard user access
  - Department Officer (DO): Department-level management
  - Executive Officer (EO): Full system access
  - Vendor: External vendor access for post-tender activities

### 5. Search and Filtering

- **Text Search**: Search by name or email
- **Role Filter**: Filter users by role type
- **Department Filter**: Filter by department
- **Status Filter**: Filter by active/inactive status
- **Real-time Filtering**: Instant results as filters are applied

### 6. Activity Tracking and Audit

- **User Activity Logs**: Track login, logout, failed attempts
- **Management Audit Trail**: Record all administrative actions
- **Timestamp Tracking**: Last login and account modification times
- **Action Attribution**: Track who performed each action

## Database Schema

### Enhanced Users Table

New columns added to the `users` table:

```sql
- password_hash (text): Hashed password storage
- password_salt (text): Password salt for security
- temp_password (text): Temporary password (plain text, temporary)
- temp_password_expires_at (timestamptz): Password expiration timestamp
- last_login (timestamptz): Last successful login time
- login_attempts (integer): Failed login attempt counter
- locked_until (timestamptz): Account lock expiration time
- created_by (uuid): User who created this account
- updated_by (uuid): User who last updated this account
```

### New Tables

#### user_activity_logs

Tracks all user activities including:
- Login/logout events
- Failed login attempts
- Password changes
- Account lock/unlock events

#### user_management_audit

Records all administrative actions:
- User creation
- User updates
- Role changes
- Account enable/disable
- Password resets
- User deletion

## How to Access User Management

### For Executive Officers (EO):

1. **Login** to the system with EO credentials
2. **Select a Module** from the module selection screen
3. **Open Actions Menu** by clicking the three-dot menu in the top-right corner
4. **Click "User Management"** to access the user management interface

## Using the User Management Interface

### Main Dashboard

The user management dashboard displays:
- Total user count
- Search and filter controls
- User list table with sortable columns
- Action buttons for each user

### Creating a New User

1. Click the **"Create User"** button in the top-right
2. Fill in the required information:
   - Full Name (required)
   - Email Address (required)
   - Role (required)
   - Department (required)
3. Click **"Create User"**
4. A temporary password will be displayed - **copy and share it securely with the user**
5. The password expires in 30 days

### Editing a User

1. Click the **Edit (pencil)** icon next to the user
2. Modify the desired fields
3. Click **"Save Changes"**
4. Changes take effect immediately

### Viewing User Details

1. Click the **Eye** icon next to the user
2. View three tabs:
   - **User Information**: Basic profile details
   - **Activity History**: Login/logout events
   - **Audit Trail**: Administrative actions performed on this user

### Resetting a User's Password

1. Click the **Key** icon next to the user
2. Confirm the password reset
3. A new temporary password is displayed - **share it securely**
4. The password expires in 7 days

### Disabling a User

1. Click the **Power Off** icon next to the user
2. The user is immediately disabled
3. Disabled users cannot log in

### Enabling a User

1. Filter by "Inactive" status to see disabled users
2. Click the **Power** icon next to the user
3. The user is immediately re-enabled

### Deleting a User

1. Click the **Trash** icon next to the user
2. Confirm the deletion
3. The user is soft-deleted (deactivated but data is preserved)

## Security Features

### Authentication Enhancements

- **Active Status Check**: Login fails for disabled users
- **Account Lock Check**: Locked accounts cannot log in
- **Last Login Tracking**: Automatic update on successful login

### Password Security

- **Strong Password Generation**: 12-character passwords with uppercase, lowercase, numbers, and symbols
- **Temporary Password Expiration**: Forces password change after period
- **No Permanent Storage**: Temporary passwords should be changed immediately

### Audit Trail

- **Complete History**: All administrative actions are logged
- **Action Attribution**: Every change is tied to the performing user
- **Timestamp Recording**: Precise timing of all actions
- **Immutable Logs**: Audit records cannot be deleted

### Role-Based Access

- **EO-Only Access**: User management is restricted to Executive Officers
- **Permission Validation**: All API calls verify EO status
- **UI Access Controls**: Non-EO users cannot see management interface

## API Endpoints (UserManagementService)

### Core Operations

```typescript
// Create a new user
UserManagementService.createUser(request: CreateUserRequest)

// Update existing user
UserManagementService.updateUser(request: UpdateUserRequest)

// Delete user (soft delete)
UserManagementService.deleteUser(userId: string, performedBy: string)

// Enable user account
UserManagementService.enableUser(userId: string, performedBy: string)

// Disable user account
UserManagementService.disableUser(userId: string, performedBy: string)

// Reset user password
UserManagementService.resetUserPassword(userId: string, performedBy: string)
```

### Query Operations

```typescript
// Get all users with filters
UserManagementService.getAllUsers(filters?: UserListFilters)

// Get single user by ID
UserManagementService.getUserById(userId: string)

// Get user activity logs
UserManagementService.getUserActivityLogs(userId: string, limit?: number)

// Get management audit trail
UserManagementService.getUserManagementAudit(userId?: string, limit?: number)
```

## Best Practices

### For Administrators

1. **Secure Password Sharing**: Share temporary passwords through secure channels (not email)
2. **Regular Audits**: Review user list and activity logs regularly
3. **Prompt Deactivation**: Disable accounts immediately when users leave
4. **Role Verification**: Double-check role assignments before saving
5. **Audit Review**: Monitor the audit trail for unusual activity

### For System Security

1. **Strong Passwords**: Always use generated passwords, never create custom ones
2. **Timely Resets**: Reset passwords for compromised accounts immediately
3. **Least Privilege**: Assign the minimum role necessary for each user
4. **Regular Reviews**: Conduct periodic access reviews
5. **Activity Monitoring**: Watch for failed login attempts and suspicious activity

## Troubleshooting

### Common Issues

**User Cannot Login**
- Check if user account is active
- Verify account is not locked
- Confirm password hasn't expired
- Check role permissions

**Password Not Working**
- Verify password was copied correctly
- Check if temporary password has expired
- Ensure account is not locked

**User Not Appearing in List**
- Check active/inactive filter
- Verify search criteria
- Refresh the user list

**Cannot Create User**
- Verify email is unique
- Check all required fields are filled
- Ensure you have EO role

## Future Enhancements (Email Integration Hook)

The system is designed with a placeholder for email integration:

```typescript
// Future email notification hook
async function sendPasswordEmail(email: string, password: string) {
  // Email service integration point
  // Can be connected to SMTP, SendGrid, AWS SES, etc.
}
```

When email integration is added:
- Automatic password delivery to new users
- Password reset notifications
- Account status change alerts
- Activity alerts for security events

## Database Functions

### Helper Functions Available

```sql
-- Log user activity
log_user_activity(user_id, activity_type, ip_address, user_agent, metadata)

-- Log management action
log_user_management_action(target_user_id, performed_by, action, old_values, new_values, remarks)

-- Check if account is locked
is_user_account_locked(user_id)
```

## Component Architecture

### Frontend Components

```
UserManagementPage (Main container)
├── UserListTable (User list display)
├── UserCreateModal (Create new user)
├── UserEditModal (Edit user details)
└── UserDetailsModal (View user details)
    ├── User Information Tab
    ├── Activity History Tab
    └── Audit Trail Tab
```

### Service Layer

```
UserManagementService
├── CRUD Operations
├── Status Management
├── Password Management
├── Query Operations
└── Activity/Audit Logging
```

## Testing Checklist

✅ **Completed Tests:**
- User creation with password generation
- User update with field modifications
- User soft deletion
- Enable/disable functionality
- Password reset
- Search and filtering
- Role assignment
- Active status authentication check
- Build compilation successful

✅ **Database Migration Applied:**
- User management schema created
- Activity logs table created
- Audit trail table created
- Helper functions deployed

✅ **Integration Complete:**
- User management accessible from admin menu
- EO-only access enforced
- Existing features unaffected

## Conclusion

The User Management System provides a complete, secure, and auditable solution for managing system users. All features are production-ready, fully integrated with existing authentication, and follow security best practices. The system maintains backward compatibility with existing users and data while adding powerful new administrative capabilities.

For support or questions, refer to the inline code documentation or contact the development team.
