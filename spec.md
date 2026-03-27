# KisanTractor Pro

## Current State
- DriverLoginScreen.tsx exists and may be referenced in routing
- Drivers screen allows owner to add/delete drivers
- NewTransaction.tsx has no tractor or driver selection fields
- App.tsx has no route/screen for driver login

## Requested Changes (Diff)

### Add
- Tractor select dropdown (optional) in NewTransaction form
- Driver select dropdown (optional) in NewTransaction form
- Both fields show saved tractors/drivers from backend

### Modify
- Remove DriverLoginScreen from the codebase (it is unused in App.tsx routing already, just delete the file and any imports)
- Drivers screen: confirm no driver login flow remains, owner manages driver details directly
- NewTransaction: after Service field, add optional Tractor field (dropdown from getAllTractors) and optional Driver field (dropdown from getAllDrivers)

### Remove
- DriverLoginScreen.tsx file
- DriverView.tsx if it references driver login
- Any store fields related to driver login (loggedInDriverId, authRole driver logic)

## Implementation Plan
1. Delete DriverLoginScreen.tsx and DriverView.tsx
2. Remove driver login references from store.ts (loggedInDriverId, setLoggedInDriverId, authRole)
3. In NewTransaction.tsx, add optional tractor select and driver select dropdowns after Service field
4. Load tractors with getAllTractors() and drivers with getAllDrivers() in NewTransaction
5. Pass selectedTractorId and selectedDriverId in the createBooking call
6. Validate - no typecheck errors
