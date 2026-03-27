# KisanTractor Pro

## Current State

- App has Bookings, NewBooking, and BookingDetail screens already in codebase
- NewBooking has unnecessary fields: village, tractorId, driverId, notes, paymentMode
- BookingDetail has Mark Ongoing/Complete but no "Complete Karo" that opens NewTransaction with auto-fill
- NewTransaction does NOT accept prefill props
- Bookings accessible from side drawer only

## Requested Changes (Diff)

### Add
- "Complete Karo" button on each pending/ongoing booking card
- NewTransaction accepts optional prefill props: partyName, mobile, workType, bookingId
- When Complete Karo tapped: navigate to NewTransaction with party+service pre-filled
- After transaction saved from booking, mark booking as "completed" in backend
- Bookings in bottom action bar (third button with calendar icon)

### Modify
- NewBooking form: remove village, tractorId, driverId, paymentMode, notes. Keep: party (live search from saved parties), mobile, service, date/time
- Bookings list: remove village display, show party name, service, date/time, status badge
- App.tsx: add bookingPrefill state, pass onComplete to Bookings, route to NewTransaction with prefill
- BookingDetail: add "Complete Karo (Transaction Banao)" button

### Remove
- Village, tractor, driver, paymentMode, notes fields from NewBooking
- Village from Bookings list display

## Implementation Plan

1. NewTransaction.tsx: Add optional prefill prop + onBookingCompleted callback
2. NewBooking.tsx: Simplify form (party search, mobile, service, date/time only)
3. Bookings.tsx: Add onComplete prop, add Complete Karo button on pending/ongoing bookings
4. App.tsx: Add bookingPrefill state, pass onComplete callback, add Bookings to bottom action bar
5. BookingDetail.tsx: Replace old status flow with single Complete Karo button
