# KisanTractor Pro

## Current State
- Dashboard has summary cards: Today's Earnings, This Month, Pending Udhar, Active Tractors
- Transactions list shows payment mode inline as plain text (e.g. `WORKTYPE • CASH • DATE`) in subtitle
- Every Booking record already stores `paymentMode: "cash" | "upi"`
- Both NewTransaction and PaymentIn forms already have Cash/UPI toggle buttons

## Requested Changes (Diff)

### Add
- Dashboard: Two new summary cards — "Aaj Cash Aaya" and "Aaj UPI Aaya" showing today's cash and UPI totals separately (computed client-side from bookings filtered by today's date + paymentMode)

### Modify
- Transactions list: Make payment mode more visually prominent — replace plain text with a colored badge/pill (green for Cash 💵, blue for UPI 📱) so it's immediately visible per transaction

### Remove
- Nothing removed

## Implementation Plan
1. **Dashboard.tsx**: Compute `todayCash` and `todayUPI` from `bookings` filtered by today's date — sum `finalAmount` where `paymentMode === "cash"` and `paymentMode === "upi"` respectively. Add two new scrollable summary cards after existing cards.
2. **Transactions.tsx**: Replace `{tx.mode.toUpperCase()}` plain text in subtitle with a styled inline badge — green pill for Cash, blue pill for UPI.
