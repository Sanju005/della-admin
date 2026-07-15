## Safe schema alignment plan

Date: 2026-07-15

Goal:
- align app writes, admin reads, and documentation around one Supabase field model
- fix mismatched field names one step at a time
- avoid risky table drops until live usage and data are verified

### Canonical direction

Use the current backend/admin schema as the source of truth.

Why:
- admin already reads it
- provider registration already writes most of it
- changing the database to match stale CSV names would create more risk than updating routes and docs

Canonical tables by responsibility:
- `profiles`: core account identity and status
- `customer_profiles`: customer profile data
- `provider_profiles`: provider profile core fields
- `provider_verifications`: provider verification state and identity media
- `provider_admin_metadata`: provider admin-only metadata, availability, media maps, coordinates, emergency contact
- `provider_services`: provider service pricing and experience
- `provider_service_specialties`: provider specialties
- `bookings`, `booking_messages`, `booking_status_history`, `notifications`: live booking workflow
- `payments`, `reviews`, `user_reports`, `login_audit_events`: trust, payments, reporting, audit

### Non-goals for the first pass

Do not:
- rename database columns just to match old CSV wording
- drop any table that is not verified as unused in live data
- remove fallback reads before backfill is complete
- combine app, admin, and schema changes in one release

### Phase 1: freeze the contract

Deliverables:
- keep `data/app-data-flow-mismatch-audit.csv` as the current audit baseline
- create one final schema contract after each route is corrected

Definition of done:
- every field used by app or admin is mapped to one canonical database location
- every route has a documented write contract

### Phase 2: fix customer writes first

Reason:
- customer CSV mismatches are the largest
- current customer routes omit many fields the app claims to send

Safe work items:
1. Extend `app/api/profile/me/route.ts` to support the missing customer profile fields the app sends.
2. Decide which signup fields must be persisted at registration time versus post-signup.
3. Keep existing fields intact; only add writes to canonical destinations.
4. If a field is not ready to persist yet, remove it from the documented contract instead of inventing a temporary table.

Expected canonical customer targets:
- `profiles.full_name`
- `profiles.email`
- `profiles.phone`
- `customer_profiles.first_name`
- `customer_profiles.last_name`
- `customer_profiles.date_of_birth`
- `customer_profiles.sex`
- `customer_profiles.phone_number`
- `customer_profiles.country_code`
- `customer_profiles.city`
- `customer_profiles.region`
- `customer_profiles.country`
- `customer_profiles.verified`
- `customer_profiles.completion`
- identity-related customer columns only if they truly exist in the live schema and are supported end to end

### Phase 3: stabilize provider writes

Reason:
- provider registration already mostly matches admin expectations
- provider profile update route is still too narrow

Safe work items:
1. Keep `provider_admin_metadata` as the source of truth for:
   - availability
   - media file maps
   - media captions
   - emergency contact
   - coordinates
2. Keep `provider_verifications` as the source of truth for:
   - phone/email verification flags
   - identity verification flags
   - identity document type
   - identity media URLs
3. Extend `app/api/provider/me/route.ts` only after customer fixes are stable.
4. Do not move provider availability/media back into older tables unless there is a strong product reason.

### Phase 4: add compatibility and backfill

Before removing any old assumptions:
1. Add fallback reads where necessary.
2. Backfill canonical fields from older columns or JSON/file sources.
3. Verify the admin pages show correct data for:
   - one customer with full profile
   - one provider with verification docs
   - one provider with service images/certificates
   - one provider with payments and bookings

Backfill rule:
- copy old data into canonical fields
- do not delete old data in the same release

### Phase 5: table cleanup

Only after live verification.

Safe drop checklist for any table:
1. Confirm the table exists in the live database.
2. Confirm no route, worker, admin page, SQL function, trigger, or policy still references it.
3. Confirm row count is zero or data has been migrated.
4. Confirm no external app or older deployment still writes to it.
5. Deploy a release that stops reading it.
6. Wait through one release cycle.
7. Drop it in a dedicated migration.

### Table cleanup policy

Status meanings:
- `active`: do not drop
- `unknown`: inspect live schema/data first
- `candidate_after_live_audit`: only droppable if confirmed unused in production

Without a live service-role audit, there are no tables I can safely mark for immediate deletion today.

### Recommended one-by-one execution order

1. Finalize canonical field map
2. Fix customer profile PATCH route
3. Fix customer signup persistence or reduce its documented contract
4. Re-test admin customer view
5. Fix provider profile PATCH route
6. Re-test admin provider view
7. Backfill data into canonical fields
8. Audit live table usage
9. Drop unused tables in a separate migration

### First implementation slice

Start with:
- `app/api/profile/me/route.ts`
- `app/api/auth/register/customer/route.ts`

Reason:
- highest mismatch concentration
- lowest risk compared with schema cleanup

### Blocking item for destructive cleanup

To remove unused Supabase tables safely, we still need a live audit using:
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`

Without that, I can prepare migrations and checklists, but I should not generate a destructive drop migration yet.
