# Quick Start Guide - TrackSphere

## Login is Now Fixed! 🎉

The login issue has been resolved. The application is now configured to use **mock authentication mode**, which means you can log in without requiring a database connection.

## How to Login

Simply refresh your browser and use any of these credentials:

### Quick Test Credentials
```
Username: admin
Password: admin
```

### All Available Users

#### Executive Officers (Full Access)
- `admin` / `admin`
- `admin@company.com` / `admin`

#### Department Officers (Department Managers)
- `manager` / `manager`
- `do.it` / `do.it`
- `do.hr` / `do.hr`
- `do.finance` / `do.finance`
- `do.operations` / `do.operations`
- `do.maintenance` / `do.maintenance`

#### Finance Officer
- `finance.officer` / `finance123`

#### Regular Employees
- `user` / `user`
- `jane.doe` / `password`

#### Vendors (External Contractors)
- `abc.construction` / `vendor123`
- `xyz.suppliers` / `vendor123`
- `global.services` / `vendor123`

## What Changed?

The `.env` file now includes:
```
VITE_AUTH_MODE=mock
VITE_APP_MODE=demo
```

This enables the application to work without requiring a database connection, perfect for testing and development.

## Application Features

Once logged in, you can:
1. **Select a Module** - Choose from Maintenance Tracker, Complaints, Grievances, RTI, or Project Execution Platform
2. **Create Tickets** - Add new work items with workflows
3. **Manage Workflows** - Track progress through multi-step processes
4. **Upload Documents** - Attach files to tickets and workflow steps
5. **Track Progress** - Monitor completion status
6. **User Management** (Admin only) - Manage users and permissions

## Need Database Mode?

To switch to database mode (when available):
1. Edit `.env` file
2. Remove or comment out: `VITE_AUTH_MODE=mock`
3. Remove or comment out: `VITE_APP_MODE=demo`
4. Restart the dev server

## Support

For detailed information about the fix, see `docs/LOGIN_FIX_SUMMARY.md`
