# KisanTractor Pro

## Current State
- Side drawer has: Dashboard, Transactions, Parties, Tractors, Expenses, Reports, Udhar
- Settings screen has: Business Logo, Language, Dark Mode, Services Management (inline), Owner Mobile, Owner Password, Driver Requests, Save button, Manage Drivers button, Logout button
- Drivers screen exists as a standalone screen navigated from Settings

## Requested Changes (Diff)

### Add
- "Drivers" menu item in side drawer nav (with a car/user icon), between Tractors and Expenses
- New `ServiceManagement` screen (dedicated page) with all service add/remove/rate editing logic extracted from Settings
- In Settings, replace the inline Services Management section with a "Manage Services" button that navigates to the new ServiceManagement screen

### Modify
- App.tsx: add `drivers` to `drawerNavItems` array
- App.tsx: add `serviceManagement` to `Screen` type and `screenTitles`
- App.tsx: render `ServiceManagement` screen when active, with back navigation to `settings`
- Settings.tsx: remove inline service management section, replace with a "Manage Services" navigation button (like the Manage Drivers button)
- Settings.tsx: remove the "Manage Drivers" button (since drivers is now in drawer)
- Back navigation in App.tsx: `serviceManagement` goes back to `settings`

### Remove
- Inline service management section from Settings.tsx (moved to new ServiceManagement screen)
- "Manage Drivers" button from Settings.tsx

## Implementation Plan
1. Create `src/frontend/src/screens/ServiceManagement.tsx` with all service add/remove/rate editing logic (extracted from Settings)
2. Modify `App.tsx`: add `drivers` to drawerNavItems, add `serviceManagement` to Screen type and screenTitles, render ServiceManagement screen, handle back nav
3. Modify `Settings.tsx`: remove inline services section + manage drivers button, add "Manage Services" nav button
