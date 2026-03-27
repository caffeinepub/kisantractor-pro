# KisanTractor Pro

## Current State
Full PWA with transactions, parties, reports, cloud sync, PDF/invoice. NewTransaction.tsx is main form. store.ts has services with per-hour/per-minute rates. i18n.ts has Gujarati+English. No voice input.

## Requested Changes (Diff)

### Add
- useVoiceInput hook using Web Speech API (gu-IN + en-IN)
- parseVoiceTransaction util: extract party name (fuzzy match), service, hours/minutes from transcript
- VoiceReview modal: shows parsed fields editable before confirm
- Mic button on NewTransaction screen

### Modify
- NewTransaction.tsx: add mic button + VoiceReview flow
- i18n.ts: add voice translations

### Remove
- Nothing

## Implementation Plan
1. useVoiceInput.ts - Web Speech API hook, gu-IN + en-IN support
2. parseVoiceTransaction.ts - parse transcript to party/service/hours/amount
3. VoiceReview.tsx - modal with editable fields + Confirm button
4. NewTransaction.tsx - integrate mic button and VoiceReview
5. i18n.ts - add voice UI keys
