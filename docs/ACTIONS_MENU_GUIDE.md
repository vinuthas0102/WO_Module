# Actions Menu - User Guide

## Overview

The Actions Menu is a consolidated dropdown interface that provides quick access to key application features. Located in the top-right corner of the dashboard, it replaces individual buttons with a clean, organized menu system.

---

## Visual Design

### Button Appearance (Icon-Only)
```
┌─────┐
│  ⋮  │  ← Blue-to-indigo gradient, icon-only
└─────┘
```

**Updated Design:**
- Icon-only button (no text label)
- Compact square shape with padding
- Three vertical dots (⋮) icon
- Blue-to-indigo gradient background
- Hover effects: scale and shadow enhancement
- High z-index (9999) to prevent overlap with other elements

### Dropdown Menu (Expanded)
```
┌──────────────────────────────────┐
│  🎫  Create Ticket               │
│      Add new workflow ticket     │
├──────────────────────────────────┤
│  ⚙️  Admin Setup        (EO only)│
│      Configure fields & modules  │
└──────────────────────────────────┘
```

---

## Menu Items

### 1. Create Ticket 🎫

**Always Visible:** Yes (All users)

**Visual Style:**
- Icon: Ticket icon in orange-to-red gradient circle
- Title: "Create Ticket" (bold)
- Description: "Add new workflow ticket" (gray text)
- Hover: Blue background highlight

**Action:**
- Opens the ticket creation form modal
- Allows user to create a new ticket in the selected module
- Form includes all configured fields for the module

**Use Cases:**
- Create new maintenance request
- Submit new complaint
- Open new grievance
- File RTI request
- Start new project execution

---

### 2. Admin Setup ⚙️

**Always Visible:** No (EO users only)

**Visual Style:**
- Icon: Settings gear icon in gray gradient circle
- Title: "Admin Setup" (bold)
- Description: "Configure fields & modules" (gray text)
- Hover: Gray background highlight
- Separator: Top border line distinguishes from regular actions

**Action:**
- Opens the Field Configuration Manager
- Allows comprehensive system administration
- Full module and field customization

**Features Available:**
1. **Field Management**
   - Add/edit/delete custom fields
   - Configure field types (text, number, date, dropdown, etc.)
   - Set validation rules
   - Define default values

2. **Visibility Control**
   - Set role-based field visibility (EO, DO, Employee)
   - Configure conditional field display
   - Manage field order and layout

3. **Module Configuration**
   - Customize fields per module
   - Define mandatory vs optional fields
   - Set up dropdown options
   - Configure field placeholders and help text

**Use Cases:**
- Add new custom fields to ticket forms
- Hide/show fields based on user role
- Update dropdown options for categories
- Restructure form layouts
- Configure validation requirements

---

## Behavior

### Opening the Menu
1. Click the "Actions" button
2. Dropdown menu slides down smoothly
3. Available actions appear based on user role

### Closing the Menu
The menu auto-closes when:
- An action is selected
- User clicks outside the menu
- User clicks the Actions button again

### Role-Based Display

**For Regular Employees & Department Officers:**
```
Actions Menu
├── Create Ticket
```

**For Executive Officers (EO):**
```
Actions Menu
├── Create Ticket
└── Admin Setup (separated)
```

---

## Keyboard & Accessibility

### Focus Management
- Tab navigation supported
- Focus moves through menu items
- Enter/Space activates selected item

### Screen Reader Support
- Proper ARIA labels on all elements
- Menu state announced (expanded/collapsed)
- Role descriptions for each action

---

## Technical Implementation

### Components Modified
- **File:** `src/App.tsx`
- **State:** `showActionsMenu` (boolean)
- **Ref:** `actionsMenuRef` (for click-outside detection)

### Icons Used
- **Menu Toggle:** `MoreVertical` (⋮)
- **Create Ticket:** `Ticket` icon
- **Admin Setup:** `Settings` icon

### Styling Classes
- Gradient backgrounds for action icons
- Hover effects with smooth transitions
- Shadow and border for dropdown
- Responsive padding and spacing

---

## Migration Notes

### Previous Design
- Separate "Create Ticket" button (orange gradient)
- Separate "Admin Setup" button (gray gradient)
- Two individual buttons taking up header space

### Current Design (v2 - Icon Only)
- Single icon-only "Actions" button (blue gradient, ⋮)
- Unified menu with icon-based actions
- Ultra-compact design saves maximum space
- High z-index (9999) prevents overlap with status cards
- Better scalability for future actions

### Benefits
1. **Maximum Space Efficiency:** Icon-only button takes minimal space
2. **No Overlap Issues:** z-index 9999 ensures dropdown stays on top
3. **Scalability:** Easy to add more actions in future
4. **Organization:** Grouped related features
5. **Modern UX:** Icon-based actions are standard in modern apps
6. **Mobile-Friendly:** Perfect for smaller screens
7. **Consistency:** Matches modern application patterns
8. **Cleaner UI:** Removes text clutter from header

---

## Future Enhancements

Potential actions to add:
- 📊 View Reports
- 📥 Export Data
- 🔔 Notifications
- 👤 User Profile
- ❓ Help & Support
- 🌙 Dark Mode Toggle

---

## Common Issues & Solutions

### Issue: Menu doesn't close
**Solution:** Click outside the menu or click Actions button again

### Issue: Admin Setup not visible
**Solution:** Ensure you're logged in as an EO user

### Issue: Menu appears behind other elements (FIXED)
**Solution:** z-index upgraded to 9999 (highest layer, prevents overlap with status cards)

---

## Best Practices

### For Users
1. Look for the Actions (⋮) button in the top-right corner
2. Hover over items to see descriptions
3. Click your desired action
4. Menu will close automatically

### For Administrators
1. Use Admin Setup to configure system before users start
2. Test field configurations in different modules
3. Set appropriate role visibility for sensitive fields
4. Document any custom field purposes

---

## Testing Checklist

- [ ] Menu opens on button click
- [ ] Menu closes when clicking outside
- [ ] Create Ticket action works for all users
- [ ] Admin Setup visible for EO users only
- [ ] Admin Setup hidden for non-EO users
- [ ] Icons display correctly
- [ ] Hover effects work smoothly
- [ ] Menu positioning is correct
- [ ] Mobile responsive (if applicable)
- [ ] Keyboard navigation works
- [ ] Screen reader announces properly

---

## Support

For issues or questions about the Actions Menu:
1. Check user role permissions
2. Verify browser compatibility
3. Clear browser cache if menu appears broken
4. Review console for JavaScript errors

---

**Last Updated:** 2025-10-23
**Version:** 2.0 (Icon-Only Design)
**Component:** Actions Menu Dropdown
**Changelog:**
- v2.0: Icon-only button, z-index fix (9999)
- v1.0: Initial dropdown with text label
