# KisanTractor Pro

## Current State
- Invoice screen has WhatsApp share button (for booking-based invoices)
- Transactions screen has WhatsApp share button per transaction card
- Notifications screen has WhatsApp button for payment reminders (when mobile is set)
- PartyDetail screen shows party phone number but has no WhatsApp/SMS share buttons
- No SMS option anywhere

## Requested Changes (Diff)

### Add
- **Invoice screen**: Add SMS button alongside existing WhatsApp button (opens default SMS app with pre-filled message)
- **Transactions screen**: Add SMS button alongside existing WhatsApp share button per transaction card
- **PartyDetail screen**: Add "Reminder Bhejo" section with WhatsApp and SMS buttons to send payment reminder to the party (using party.phone)
- **Notifications screen**: Add SMS button alongside existing WhatsApp button for payment reminders
- **NewTransaction (after save)**: Show both WhatsApp and SMS share options in the post-save confirmation/invoice flow

### Modify
- Existing WhatsApp buttons stay as-is; SMS buttons open `sms:+91{mobile}?body={encodedMessage}` URI
- SMS message format mirrors WhatsApp message format (party name, service, amount, date)

### Remove
- Nothing removed

## Implementation Plan
1. Create a shared `shareViaWhatsApp(mobile, message)` and `shareViaSMS(mobile, message)` helper utility in a shared file or inline
2. Invoice.tsx: Add SMS button next to WhatsApp button
3. Transactions.tsx: Add SMS button next to existing WhatsApp share button in transaction card (only when party mobile is available)
4. PartyDetail.tsx: Add a "Reminder Bhejo" card/section with WhatsApp + SMS buttons using party.phone; pre-fill a payment reminder message with party name and pending udhar amount
5. Notifications.tsx: Add SMS button next to existing WhatsApp button for payment reminders
6. Keep buttons compact (icon + short label) so mobile UI isn't cluttered
