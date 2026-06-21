# Admin Live Data Checklist

Updated: 2026-06-21

This checklist compares the current admin panel against the fields already present in the mobile app flow and Supabase-backed APIs.

## Customers

| Field | Source | Admin status |
| --- | --- | --- |
| `profiles.id` | Supabase `profiles` | Wired |
| `profiles.full_name` | Supabase `profiles` | Wired |
| `profiles.email` | Supabase `profiles` | Wired |
| `profiles.role` | Supabase `profiles` | Wired |
| `profiles.status` | Supabase `profiles` | Wired |
| `profiles.phone` | Supabase `profiles` | Wired |
| `profiles.created_at` | Supabase `profiles` | Wired |
| `customer_profiles.first_name` | Supabase `customer_profiles` | Wired |
| `customer_profiles.last_name` | Supabase `customer_profiles` | Wired |
| `customer_profiles.date_of_birth` | Supabase `customer_profiles` | Wired |
| `customer_profiles.phone_number` | Supabase `customer_profiles` | Wired |
| `customer_profiles.country_code` | Supabase `customer_profiles` | Wired |
| `customer_profiles.city` | Supabase `customer_profiles` | Wired |
| `customer_profiles.region` / `state` | Supabase `customer_profiles` | Wired |
| `customer_profiles.country` | Supabase `customer_profiles` | Wired |
| `customer_profiles.verified` | Supabase `customer_profiles` | Wired |
| `customer_profiles.completion` | Supabase `customer_profiles` | Wired |
| Booking summary: upcoming/completed/cancelled | Supabase `bookings` | Wired |
| Recent bookings list | Supabase `bookings` | Wired |
| Recent payments list | Supabase `payments` | Wired |
| Recent reviews list | Supabase `reviews` | Wired |
| Reports submitted | No live table mapped yet | Gap |
| Device / IP / referrer / login analytics | Not persisted in current schema | Gap |
| Wallet balance | No live wallet source mapped | Gap |

## Providers

| Field | Source | Admin status |
| --- | --- | --- |
| `profiles.id` | Supabase `profiles` | Wired |
| `profiles.full_name` | Supabase `profiles` | Wired |
| `profiles.email` | Supabase `profiles` | Wired |
| `profiles.status` | Supabase `profiles` | Wired |
| `profiles.phone` | Supabase `profiles` | Wired |
| `profiles.created_at` | Supabase `profiles` | Wired |
| `provider_profiles.marketing_name` | Supabase `provider_profiles` | Wired |
| `provider_profiles.service_location` | Supabase `provider_profiles` | Wired |
| `provider_profiles.service_radius_km` | Supabase `provider_profiles` | Wired |
| `provider_profiles.date_of_birth` | Supabase `provider_profiles` | Wired |
| `provider_profiles.sex` | Supabase `provider_profiles` | Wired |
| `provider_profiles.residential_address` | Supabase `provider_profiles` | Wired |
| `provider_profiles.bio` | Supabase `provider_profiles` | Wired |
| `provider_profiles.average_rating` | Supabase `provider_profiles` | Wired |
| `provider_profiles.total_reviews` | Supabase `provider_profiles` | Wired |
| `provider_profiles.approval_status` | Supabase `provider_profiles` | Wired |
| `provider_profiles.is_visible` | Supabase `provider_profiles` | Wired |
| `provider_services.service_type` | Supabase `provider_services` | Wired |
| `provider_services.years_experience` | Supabase `provider_services` | Wired |
| `provider_services.hourly_rate` | Supabase `provider_services` | Wired |
| `provider_services.daily_rate` | Supabase `provider_services` | Wired |
| `provider_service_specialties.specialty` | Supabase `provider_service_specialties` | Wired |
| `provider_verifications.phone_verified` | Supabase `provider_verifications` | Wired |
| `provider_verifications.email_verified` | Supabase `provider_verifications` | Wired |
| `provider_verifications.identity_verified` | Supabase `provider_verifications` | Wired |
| `provider_verifications.kyc_verified` | Supabase `provider_verifications` | Wired |
| `provider_verifications.background_check_verified` | Supabase `provider_verifications` | Wired |
| `provider_verifications.document_type` | Supabase `provider_verifications` | Wired |
| `provider_verifications.front_image_name` | Supabase `provider_verifications` | Wired |
| `provider_verifications.back_image_name` | Supabase `provider_verifications` | Wired |
| `provider_verifications.requested_documents` | Supabase `provider_verifications` | Wired |
| `provider_verifications.admin_note` | Supabase `provider_verifications` | Wired |
| `provider_verifications.last_reviewed_at` | Supabase `provider_verifications` | Wired |
| Upcoming bookings | Supabase `bookings` | Wired |
| Completed bookings | Supabase `bookings` | Wired |
| Cancelled bookings | Supabase `bookings` | Wired as counts, reason still gap |
| Cancellation reason | Supabase `bookings.decline_reason` / cancel note fields | Gap |
| Provider payment history | Supabase `payments` | Wired |
| Customer review rows | Supabase `reviews` | Wired |
| Current location coordinates | Not stored in provider tables | Gap |
| Service images | Only registration draft data today | Gap |
| Image captions | Only registration draft data today | Gap |
| Certificate captions | Only registration draft data today | Gap |
| Availability days / hours | Only registration draft data today | Gap |
| Emergency contact | Not stored in current schema | Gap |
| Language | Not stored in current schema | Gap |

## Internal Staff

| Field | Source | Admin status |
| --- | --- | --- |
| `profiles.id` | Supabase `profiles` | Wired |
| `profiles.full_name` | Supabase `profiles` | Wired |
| `profiles.email` | Supabase `profiles` | Wired |
| `profiles.role` | Supabase `profiles` | Wired |
| `profiles.status` | Supabase `profiles` | Wired |
| `profiles.created_at` | Supabase `profiles` | Wired |

## Important backend gaps

These fields are visible in the mobile registration flow, but they are not persisted in the main Supabase provider tables that the admin reads:

- provider availability days
- provider availability preset/start/end time
- service image captions
- certificate captions
- current picked map coordinates

Today they only exist in the temporary provider registration record store, so they are not safe as long-term live admin data until they are moved into Supabase tables.
