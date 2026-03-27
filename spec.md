# KisanTractor Pro

## Current State
App has a top header with hamburger menu (drawer) on all screens. Sub-screens (NewTransaction, PaymentIn, NewBooking, BookingDetail, PartyDetail, Settings, Invoice, etc.) receive `onBack` props but there is no visible back button in the header. Users on mobile have no way to go back using the top navigation bar.

## Requested Changes (Diff)

### Add
- Back arrow button (ChevronLeft/ArrowLeft) in the top header when user is on a sub-screen (non-main screen)
- Screen title in the header when on sub-screens (e.g., "New Transaction", "Settings", "Party Detail", etc.)

### Modify
- App.tsx: Header should conditionally show back button + screen title instead of hamburger menu when on a sub-screen
- Sub-screens are: newTransaction, paymentIn, newBooking, bookingDetail, invoice, partyDetail, settings, tractors, drivers, expenses, credits, reports
- Main screens (no back button, show hamburger): dashboard, transactions, bookings, parties

### Remove
- Nothing removed

## Implementation Plan
1. In App.tsx, define a `screenTitles` map for sub-screen labels (Gujarati + English)
2. Determine if current screen is a sub-screen (not in `mainScreens`)
3. In the header: if sub-screen, show ArrowLeft back button + screen title; if main screen, show hamburger + business name as usual
4. The back button calls the appropriate `onBack` handler based on current screen (same logic as what's passed to each screen component)
