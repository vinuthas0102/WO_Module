# User Display Preferences RLS Security Fix

## Issue Fixed
The `user_display_preferences` table had RLS (Row Level Security) enabled but the policies were too restrictive. They only allowed users to access their own preferences, which prevented EO (Executive Officer) users from managing other users' display preferences during user creation and editing.

## Migration Applied
**File**: `supabase/migrations/20251111000000_fix_user_display_preferences_rls.sql`

## Changes Made

### Old Policies (Removed)
- Users could only read their own preferences
- Users could only insert their own preferences
- Users could only update their own preferences
- Users could only delete their own preferences

### New Policies (Implemented)

1. **SELECT Policy**: "Users can read display preferences"
   - Users can read their own preferences
   - EO users can read ALL users' preferences

2. **INSERT Policy**: "Users can insert display preferences"
   - Users can insert their own preferences
   - EO users can insert preferences for any user

3. **UPDATE Policy**: "Users can update display preferences"
   - Users can update their own preferences
   - EO users can update any user's preferences

4. **DELETE Policy**: "Users can delete own display preferences"
   - Users can only delete their own preferences (no EO override for data safety)

### Additional Improvements
- Added performance index: `idx_users_role_lower` on `LOWER(users.role)` for faster policy checks
- Ensured RLS remains enabled
- Updated table comment to explain security model

## Impact Areas - Testing Required

### 1. User Management Page (EO Only)
**File**: `src/components/admin/UserManagementPage.tsx`

**Test Cases**:
- ✅ Login as EO user
- ✅ Navigate to User Management page
- ✅ View list of users
- ✅ Verify action icons display correctly for each user (based on their preferences)
- ✅ Click "Edit" on a user
- ✅ Verify user's display preferences load in the edit modal
- ✅ Change the display preferences (icon type, size, labels, etc.)
- ✅ Save changes
- ✅ Verify preferences are updated successfully
- ✅ Reload the page and verify preferences persisted

### 2. User Edit Modal (EO Only)
**File**: `src/components/admin/UserEditModal.tsx`
**Lines**: 34 (load preferences), 85 (save preferences)

**Test Cases**:
- ✅ Login as EO user
- ✅ Open User Management
- ✅ Click "Edit" on any user
- ✅ Verify the "Display Preferences" section loads
- ✅ Check that current values match the user's preferences
- ✅ Modify Icon Display Type (try different options: Dropdown Menu, Carousel, Grid, etc.)
- ✅ Modify Icon Size (Small, Medium, Large)
- ✅ Toggle "Show Labels", "Group by Category", "Enable Animations"
- ✅ Click "Save Changes"
- ✅ Verify success message
- ✅ Re-edit the same user and confirm changes persisted

### 3. User Creation Modal (EO Only)
**File**: `src/components/admin/UserCreateModal.tsx`
**Line**: 61 (save initial preferences)

**Test Cases**:
- ✅ Login as EO user
- ✅ Click "Create User" button
- ✅ Fill in user details (name, email, role, department)
- ✅ Set display preferences in the form
- ✅ Click "Create User"
- ✅ Verify user is created successfully
- ✅ Edit the newly created user
- ✅ Verify the display preferences match what was set during creation
- ✅ Try creating a user with default preferences (don't change settings)
- ✅ Verify defaults are: Dropdown Menu, Medium size, Show Labels ON, others OFF

### 4. User Preferences Page (All Users)
**File**: `src/components/admin/UserPreferencesPage.tsx`

**Test Cases**:
- ✅ Login as regular user (Employee, DO, Vendor)
- ✅ Navigate to User Preferences page (if accessible)
- ✅ View current preferences
- ✅ Modify preferences
- ✅ Save changes
- ✅ Verify changes are saved
- ✅ Logout and login again
- ✅ Verify preferences persisted
- ✅ Verify action icons throughout the app reflect the new preferences

### 5. Login Flow & Auth Context (All Users)
**File**: `src/context/AuthContext.tsx`
**Line**: 85 (load preferences on login)

**Test Cases**:
- ✅ Login as any user (EO, DO, Employee, Vendor)
- ✅ Verify preferences load automatically
- ✅ Navigate through the application
- ✅ Verify action icons display according to user's preferences
- ✅ Logout and login as different user
- ✅ Verify preferences are user-specific
- ✅ Check console for any RLS policy errors

### 6. User List Table (EO Only)
**File**: `src/components/admin/UserListTable.tsx`

**Test Cases**:
- ✅ Login as EO user
- ✅ Navigate to User Management
- ✅ View the user list table
- ✅ Verify action icons appear in the "Actions" column
- ✅ Verify icons display based on EO's own preferences (not the listed users' preferences)
- ✅ Click various action icons (View, Edit, Reset Password, Delete)
- ✅ Verify all actions work correctly

### 7. Icon Display Throughout Application (All Users)
**Files**:
- `src/components/iconDisplay/IconDisplayWrapper.tsx`
- Various ticket and workflow components

**Test Cases**:
- ✅ Login as any user
- ✅ Navigate to different pages (Dashboard, Tickets, Workflows)
- ✅ Verify action icons display correctly based on user's preferences
- ✅ Try different display types:
  - Dropdown Menu: Icons in dropdown
  - Carousel: Swipeable icon carousel
  - Grid: Icons in grid layout
  - Horizontal Toolbar: Icons in horizontal row
  - Floating Action Button: FAB with expandable menu
  - Vertical Sidebar: Icons in vertical sidebar
- ✅ Verify icon size affects display (small/medium/large)
- ✅ Toggle "Show Labels" and verify labels appear/disappear
- ✅ Test animations if enabled

## Security Verification

### What Was Protected
✅ RLS is still enabled on `user_display_preferences` table
✅ Regular users (Employee, DO, Vendor) can only access their own preferences
✅ EO users have elevated permissions for administrative tasks
✅ Delete operations are restricted to own data only (even for EO)
✅ All operations require authentication

### What Changed
- EO users can now read all users' preferences (required for viewing in user list)
- EO users can now create preferences for new users (required for user creation)
- EO users can now update any user's preferences (required for user editing)

### Performance Optimization
- Added index on `LOWER(users.role)` to speed up policy checks
- Policies use efficient EXISTS queries with indexed lookups

## Error Scenarios to Test

1. **Non-EO User Trying to Access Others' Preferences**
   - Login as Employee/DO/Vendor
   - Try to access User Management (should be denied at UI level)
   - Verify RLS prevents any backend access attempts

2. **Unauthenticated Access**
   - Logout
   - Verify no access to preferences table
   - Verify RLS blocks all operations

3. **Edge Cases**
   - User with no preferences record (should create default)
   - Multiple rapid updates (should handle concurrency)
   - Invalid preference values (should be validated by constraints)

## Database Verification Queries

### Check RLS Status
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'user_display_preferences';
```
Expected: `rowsecurity = true`

### List Current Policies
```sql
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'user_display_preferences';
```
Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE)

### Test Policy as Regular User
```sql
-- Set session to simulate regular user
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid-here"}';

-- Try to read own preferences (should work)
SELECT * FROM user_display_preferences WHERE user_id = 'user-uuid-here';

-- Try to read another user's preferences (should return empty)
SELECT * FROM user_display_preferences WHERE user_id = 'different-user-uuid';
```

### Test Policy as EO User
```sql
-- Set session to simulate EO user with role 'EO' in users table
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "eo-user-uuid-here"}';

-- Try to read all preferences (should work)
SELECT * FROM user_display_preferences;

-- Try to update another user's preferences (should work)
UPDATE user_display_preferences
SET icon_size = 'large'
WHERE user_id = 'different-user-uuid';
```

## Rollback Plan

If issues occur, apply this rollback migration:

```sql
-- Restore original restrictive policies
DROP POLICY IF EXISTS "Users can read display preferences" ON user_display_preferences;
DROP POLICY IF EXISTS "Users can insert display preferences" ON user_display_preferences;
DROP POLICY IF EXISTS "Users can update display preferences" ON user_display_preferences;

CREATE POLICY "Users can read own display preferences"
  ON user_display_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own display preferences"
  ON user_display_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own display preferences"
  ON user_display_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Summary

This fix ensures that:
1. ✅ RLS remains enabled and enforced
2. ✅ Regular users can only access their own preferences
3. ✅ EO users can manage all users' preferences for administrative purposes
4. ✅ The User Management workflow now functions correctly
5. ✅ User creation and editing includes preference management
6. ✅ Security is maintained with proper role-based access control
