# KisanTractor Pro

## Current State
- Invoice screen (Invoice.tsx) shows transaction details with WhatsApp share and a print button via window.print()
- Invoice shows a tractor emoji and app name but no business logo or editable business name
- Business name stored in localStorage (key: businessName), shown in App.tsx header
- No monthly statement feature exists
- Settings has no business logo upload option
- PartyDetail.tsx shows party transaction history but no PDF/download option

## Requested Changes (Diff)

### Add
- PDF Download button on Invoice screen -- uses browser print-to-PDF via window.print() with clean print CSS
- Monthly Statement screen -- new component for a party showing all transactions for a selected month, with download PDF and WhatsApp share buttons
- Business logo on Invoice -- Settings gets a logo upload section (stored as base64 in localStorage key businessLogo); Invoice shows logo above business name
- Business name on Invoice -- read businessName from localStorage instead of hardcoded app name

### Modify
- Invoice.tsx -- add logo display, use businessName from localStorage, improve print CSS, rename print button to PDF Download
- Settings.tsx -- add Business Logo section with file input, preview, remove button; save as base64 to localStorage key businessLogo
- PartyDetail.tsx -- add Monthly Statement button that shows the monthly statement view

### Remove
- Nothing

## Implementation Plan
1. Settings.tsx: Add business logo section with file input (accept image/*), base64 storage, preview and remove
2. Invoice.tsx: Read businessName and businessLogo from localStorage, show logo in header, add clean print/PDF CSS via style tag, update button label to PDF Download
3. MonthlyStatement.tsx (new): Month selector (default current month), filtered bookings for selected party+month, table with Date/Service/Type/Amount/Mode columns, totals, PDF download (window.print()) and WhatsApp share buttons, clean @media print styles
4. PartyDetail.tsx: Add Monthly Statement button, show MonthlyStatement component as inline sub-view via state
