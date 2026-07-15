## Backfill Checklist

Date: 2026-07-15

Purpose:
- list the remaining live-data gaps after the route and CSV alignment work
- prepare for a later live Supabase audit and non-destructive backfill

### Customer backfill candidates

- `customer_profiles.sex`
  Reason: older customer rows may have auth metadata `sex` but no `customer_profiles.sex`

- `customer_profiles.country`
  Reason: profile PATCH now writes it, but older rows may only have `region` or `state`

- `customer_profiles.state`
  Reason: profile PATCH now mirrors region into state, but older rows may be incomplete

- `customer_profiles.date_of_birth`
  Reason: signup now writes it, older signup rows may not have it

### Provider backfill candidates

- `provider_admin_metadata.emergency_contact`
  Reason: older provider rows may only have emergency contact in registration JSON fallback or not at all

- `provider_admin_metadata.availability_days`
  Reason: current provider PATCH now writes it, but older rows may be empty

- `provider_admin_metadata.availability_time_preset`
- `provider_admin_metadata.availability_start_time`
- `provider_admin_metadata.availability_end_time`
  Reason: older rows may have partial availability only

- auth `user_metadata.marketing_name`
  Reason: provider PATCH now syncs it, older auth users may not have it

### Not ready for backfill without live schema confirmation

- customer identity document fields
- customer identity image URLs
- customer emergency contact fields
- provider avatar fields outside `provider_profiles.profile_photo_url`
- legacy `provider_availability`
- legacy `addresses`

### Safe backfill order

1. Read live row counts and null counts
2. Backfill customer canonical fields
3. Backfill provider metadata fields
4. Verify dashboard and admin screens
5. Only then evaluate cleanup candidates

### Required before running backfill

- live access with `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`
- confirmation of production schema for any uncertain columns
- agreement on whether legacy tables like `addresses` and `provider_availability` still exist
