## Admin field check against CSV flow maps

Date: 2026-07-15

Scope:
- `data/customer-app-data-flow.csv`
- `data/provider-app-data-flow.csv`
- Current route handlers and admin readers in this repo

Limitation:
- A live Supabase row-level verification could not be run from this workspace because `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` is not present in the local env files. This check verifies the CSVs against the current code paths instead.

### Customer flow findings

#### 1. Customer signup CSV overstates what is currently saved

CSV claims the signup flow writes:
- `profiles.avatar_url`
- `customer_profiles.date_of_birth`
- `customer_profiles.sex`
- address data into `addresses`
- verification-related customer fields

Current code in `app/api/auth/register/customer/route.ts` only persists:
- `profiles.id`
- `profiles.full_name`
- `profiles.email`
- `profiles.role`
- `profiles.phone`
- `profiles.status`
- `customer_profiles.id`
- `customer_profiles.first_name`
- `customer_profiles.last_name`
- `customer_profiles.country`

The current signup route does not persist avatar, DOB, address rows, emergency contact, or customer identity-verification fields.

#### 2. Customer profile update CSV is broader than the current PATCH route

CSV claims the profile PATCH updates:
- `profiles.avatar_url`
- auth `user_metadata` verification flags
- `customer_profiles.identity_document_type`
- `customer_profiles.identity_front_image_url`
- `customer_profiles.identity_back_image_url`
- `customer_profiles.emergency_contact_number`
- `customer_profiles.country`

Current code in `app/api/profile/me/route.ts` actually updates:
- `profiles.full_name`
- `profiles.email`
- `profiles.phone`
- auth `user_metadata.full_name`
- auth `user_metadata.first_name`
- auth `user_metadata.last_name`
- auth `user_metadata.sex`
- `customer_profiles.first_name`
- `customer_profiles.last_name`
- `customer_profiles.date_of_birth`
- `customer_profiles.phone_number`
- `customer_profiles.country_code`
- `customer_profiles.city`
- `customer_profiles.region`
- `customer_profiles.verified`
- `customer_profiles.completion`
- `customer_profiles.updated_at`

The current route does not write avatar, emergency contact, country, phone/email verification flags, identity verification status, identity document type, or identity image URLs.

#### 3. Customer verification rows in the CSV do not match the current PATCH payload type

The CSV lists separate PATCH payloads for:
- email verification
- phone verification
- identity-document submission

Current `UpdatePayload` in `app/api/profile/me/route.ts` does not include:
- `emailVerified`
- `phoneVerified`
- `identityVerificationStatus`
- `identityDocumentType`
- `identityFrontImageUrl`
- `identityBackImageUrl`

That means the current backend in this repo does not support the verification-field writes described by the CSV.

### Provider flow findings

#### 4. Provider registration persists a lot, but not to all the columns named in the CSV

CSV claims the registration flow writes to:
- `profiles.avatar_url`
- `provider_profiles.verification_status`
- `provider_profiles.formatted_address`
- `provider_profiles.road`
- `provider_profiles.suburb`
- `provider_profiles.city`
- `provider_profiles.state`
- `provider_profiles.postcode`
- `provider_profiles.country`
- `provider_profiles.house_number`
- `provider_profiles.latitude`
- `provider_profiles.longitude`
- `provider_availability.*`
- `provider_services.image_data_urls`
- `provider_services.image_captions`
- `provider_services.certificate_data_urls`
- `provider_services.certificate_captions`

Current code in `app/api/provider/register/route.ts` actually persists:
- `profiles.id`
- `profiles.full_name`
- `profiles.email`
- `profiles.role`
- `profiles.phone`
- `profiles.status`
- `provider_profiles.id`
- `provider_profiles.marketing_name`
- `provider_profiles.service_location`
- `provider_profiles.service_radius_km`
- `provider_profiles.date_of_birth`
- `provider_profiles.sex`
- `provider_profiles.residential_address`
- `provider_profiles.profile_photo_url`
- `provider_profiles.bio`
- `provider_profiles.approval_status`
- `provider_profiles.is_visible`
- `provider_admin_metadata.availability_days`
- `provider_admin_metadata.availability_time_preset`
- `provider_admin_metadata.availability_start_time`
- `provider_admin_metadata.availability_end_time`
- `provider_admin_metadata.service_image_captions`
- `provider_admin_metadata.certificate_image_captions`
- `provider_admin_metadata.service_image_files`
- `provider_admin_metadata.certificate_image_files`
- `provider_admin_metadata.emergency_contact`
- `provider_admin_metadata.profile_image_name`
- `provider_admin_metadata.current_latitude`
- `provider_admin_metadata.current_longitude`
- `provider_verifications.phone_verified`
- `provider_verifications.email_verified`
- `provider_verifications.identity_verified`
- `provider_verifications.kyc_verified`
- `provider_verifications.background_check_verified`
- `provider_verifications.document_type`
- `provider_verifications.identity_document_type`
- `provider_verifications.front_image_name`
- `provider_verifications.back_image_name`
- `provider_verifications.document_front_url`
- `provider_verifications.document_back_url`
- `provider_verifications.identity_front_image_url`
- `provider_verifications.identity_back_image_url`
- `provider_services.provider_id`
- `provider_services.service_type`
- `provider_services.years_experience`
- `provider_services.hourly_rate`
- `provider_services.daily_rate`
- `provider_service_specialties.provider_service_id`
- `provider_service_specialties.specialty`

Main mismatches:
- profile image is stored in `provider_profiles.profile_photo_url`, not `profiles.avatar_url`
- availability is stored in `provider_admin_metadata`, not `provider_availability`
- service/certificate media maps are stored in `provider_admin_metadata.*_image_files` and `*_image_captions`, not `provider_services.image_data_urls` / `certificate_data_urls`
- location coordinates are stored in `provider_admin_metadata.current_latitude/current_longitude`, not `provider_profiles.latitude/longitude`
- the CSV lists several `provider_profiles` location columns that are not written by the current route

#### 5. Provider PATCH CSV is broader than the current provider PATCH route

CSV claims provider PATCH supports:
- `avatarUrl`
- `country`
- `emergencyContactNumber`
- `phoneVerified`
- `identityVerified`
- `identityVerificationStatus`
- `identityDocumentType`
- `identityFrontImageUrl`
- `identityBackImageUrl`

Current `PATCH` in `app/api/provider/me/route.ts` only updates:
- `profiles.full_name`
- `provider_profiles.marketing_name`
- `provider_profiles.service_location`
- `provider_profiles.service_radius_km`
- `provider_profiles.bio`

The provider PATCH route in this repo does not currently persist the verification or media fields described in the CSV.

#### 6. Admin provider views read metadata tables, not the columns named in the CSV

The admin provider loader in `src/lib/admin-providers.ts` expects live provider admin data primarily from:
- `provider_admin_metadata.service_image_files`
- `provider_admin_metadata.certificate_image_files`
- `provider_admin_metadata.emergency_contact`
- `provider_admin_metadata.current_latitude`
- `provider_admin_metadata.current_longitude`
- `provider_verifications.identity_front_image_url`
- `provider_verifications.identity_back_image_url`

So the current admin implementation aligns better with the route code than with parts of the provider CSV.

### Conclusion

The CSVs are useful as flow documentation, but they do not fully match the current backend in this repo.

Most important gaps:
- customer CSV claims more persisted fields than the current customer routes actually save
- provider CSV uses several old or alternate target columns/tables that the current code no longer writes
- current admin provider pages are built around `provider_admin_metadata` and `provider_verifications`, not the older field layout described in parts of the CSV

### Recommended next steps

1. Decide whether the CSVs should document the current implementation or the intended implementation.
2. If they should reflect current code, update both CSVs to the exact write targets listed above.
3. If they describe intended behavior, the missing route writes need to be implemented before the admin can rely on those fields.
4. If you want a live Supabase verification script next, add `SUPABASE_SERVICE_ROLE_KEY` to the local env and I can generate a row-by-row field audit.
