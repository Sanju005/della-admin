# Live Supabase Audit - 2026-07-15

Generated with:

- `scripts/live-supabase-audit.mjs`

Output files:

- `data/live-audit/live-summary.csv`
- `data/live-audit/live-customers.csv`
- `data/live-audit/live-providers.csv`
- `data/live-audit/live-mismatches.csv`

## Live totals

- `profiles`: 76
- customer roles in `profiles`: 12
- provider roles in `profiles`: 62
- `customer_profiles`: 12
- `provider_profiles`: 60
- `provider_verifications`: 59
- `provider_admin_metadata`: 1
- `provider_services`: 60
- `provider_documents`: 0 rows returned because the table does not exist in the live schema
- mismatch rows: 64

## Main findings

1. Customer base is structurally aligned.
   - 12 customer accounts exist in `profiles`
   - 12 matching rows exist in `customer_profiles`
   - customer issues are mostly incomplete field values, not missing relational rows

2. Provider base is only partially aligned.
   - 62 provider accounts exist in `profiles`
   - only 60 matching rows exist in `provider_profiles`
   - only 59 matching rows exist in `provider_verifications`
   - only 1 matching row exists in `provider_admin_metadata`

3. Admin currently cannot show many provider detail fields consistently because almost all providers are missing `provider_admin_metadata`.
   - this affects fields such as emergency contact, availability days, availability hours, current coordinates, and profile image file metadata

4. Admin code references `provider_documents`, but the live Supabase schema currently does not have `public.provider_documents`.

## Mismatch breakdown

- `missing_provider_admin_metadata`: 59
- `missing_provider_services`: 2
- `missing_provider_profile`: 2
- `missing_provider_verification`: 1

## Specific provider gaps

Missing `provider_profiles`:

- `8754579b-aa91-4674-afa0-20d13cfceaba` (`rajnew@gmail.com`)
- `36b27dee-d586-4b16-ad45-622163c1af30` (`sanjunew@gmail.com`)

Missing `provider_verifications`:

- `73ea3347-5c13-424b-ae9a-b731cce885aa` (`mannanmuru@gmail.com`)

Missing `provider_services`:

- `73ea3347-5c13-424b-ae9a-b731cce885aa` (`mannanmuru@gmail.com`)
- `24538156-50bf-4209-b631-82291d1f1dbb` (`raj@gmail.com`)

## Safe fix order

1. Backfill the 2 missing `provider_profiles` rows.
2. Backfill the 1 missing `provider_verifications` row.
3. Backfill `provider_admin_metadata` for the 59 providers missing it.
4. Backfill provider services for the 2 providers missing service rows.
5. Review whether `provider_documents` should be removed from admin code or introduced as a real table.
6. Only after backfill and live verification, evaluate unused table removal.

## Current answer to "can admin see all live user/provider data?"

Partly:

- Customers: mostly yes, with some incomplete values on some accounts.
- Providers: core profile data is live, but many provider detail fields cannot be shown consistently until `provider_admin_metadata` is backfilled.
