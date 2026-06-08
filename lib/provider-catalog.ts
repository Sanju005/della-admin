import "server-only";

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublishableKey, getSupabaseUrl } from "./supabase-env";
import { serviceOrder, type ProviderCategoryKey } from "./provider-catalog-shared";
export {
  buildCategoryBannerSrc,
  buildProviderDetailHref,
  buildProviderPortraitSrc,
  serviceOrder,
} from "./provider-catalog-shared";
export type { ProviderCategoryKey } from "./provider-catalog-shared";

type ProviderServiceSpecialtyRow = {
  specialty: string | null;
};

type ProviderVerificationRow = {
  email_verified: boolean | null;
};

type ProviderCatalogRow = {
  id: string;
  marketing_name: string | null;
  service_location: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  bio: string | null;
  approval_status: string | null;
  provider_verifications: ProviderVerificationRow | ProviderVerificationRow[] | null;
  provider_services:
    | Array<{
        service_type: string;
        hourly_rate: number | null;
        daily_rate: number | null;
        years_experience: string | null;
        provider_service_specialties: ProviderServiceSpecialtyRow[] | null;
      }>
    | null;
};

export type ProviderListing = {
  id: string;
  name: string;
  providerName?: string;
  serviceKey: ProviderCategoryKey;
  serviceLabel: string;
  title: string;
  workMode: "Live-in" | "Part-time" | "Full-time";
  location: string;
  distanceKm: number;
  rating: number;
  reviews: number;
  hourlyRate: number;
  dailyRate: number;
  yearsExperience: string;
  specialties: string[];
  bio: string;
  availabilityLabel: string;
  imageTone: string;
  isApproved: boolean;
};

export type ProviderCatalogData = {
  service: ProviderCategoryKey | null;
  serviceLabel: string;
  listings: ProviderListing[];
  errorMessage: string | null;
};

const serviceLabels: Record<ProviderCategoryKey, string> = {
  chef: "Chef",
  maid: "Maid",
  babysitter: "Babysitter",
  driver: "Driver",
  cleaner: "Cleaner",
  tutor: "Tutor",
  plumber: "Plumber",
  electrician: "Electrician",
};

const imageTones = [
  "bg-[linear-gradient(135deg,#3a2417_0%,#8f5a35_40%,#d6b089_100%)]",
  "bg-[linear-gradient(135deg,#d7c0a9_0%,#f2e7d9_45%,#8cb39a_100%)]",
  "bg-[linear-gradient(135deg,#d6c7b2_0%,#f0e3d7_45%,#9e8a72_100%)]",
  "bg-[linear-gradient(135deg,#d8e6db_0%,#f0f6ef_45%,#7aa884_100%)]",
  "bg-[linear-gradient(135deg,#20352b_0%,#2f7d4e_45%,#a7d7a9_100%)]",
];

const mockListings: Record<ProviderCategoryKey, ProviderListing[]> = {
  chef: [
    mock("chef", "Chef Amina", "Private Chef", "Kajang, Selangor", 2.4, 4.9, 128, 35, 220, "6 Years", ["Malay", "Arabic"], "Experienced home chef for family dining and events.", "Available Today", 0),
    mock("chef", "Chef Daniel", "Home Chef", "Mont Kiara, Kuala Lumpur", 3.1, 4.8, 96, 42, 260, "8 Years", ["Italian", "Western"], "Private chef for home dining, parties, and weekly meal prep.", "Available Today", 1),
    mock("chef", "Chef Mei Ling", "Event Chef", "Ampang, Selangor", 4.3, 4.7, 84, 38, 240, "5 Years", ["Chinese", "Asian"], "Trusted DELLA chef for family gatherings and event catering.", "Available Today", 2),
    mock("chef", "Chef Hikaru", "Personal Chef", "Setapak, Kuala Lumpur", 2.8, 4.8, 73, 40, 250, "7 Years", ["Japanese", "Healthy"], "Flexible chef for home service, healthy menus, and dinner events.", "Available Today", 3),
    mock("chef", "Chef Sofia", "Family Chef", "Shah Alam, Selangor", 3.5, 4.6, 67, 34, 210, "4 Years", ["Malay", "Indian"], "Affordable family chef focused on daily meals and weekend events.", "Available Today", 4),
  ],
  maid: [
    mock("maid", "Siti Maid Service", "Maid", "Setapak, Kuala Lumpur", 1.8, 4.8, 96, 25, 180, "5 Years", ["Cleaning", "Laundry"], "Reliable maid service for daily home care and deep cleaning.", "Available Today", 1),
    mock("maid", "Devi Maid Care", "Maid", "Klang, Selangor", 3.2, 4.7, 88, 24, 170, "4 Years", ["Ironing", "Cleaning"], "Professional maid for household support, laundry, and kitchen upkeep.", "Available Today", 2),
    mock("maid", "Nora Home Help", "Maid", "Petaling Jaya, Selangor", 2.7, 4.8, 61, 28, 190, "6 Years", ["Deep cleaning", "Laundry"], "Detailed and trusted maid for recurring home service.", "Available Today", 3),
    mock("maid", "Lina Maid Assist", "Maid", "Puchong, Selangor", 2.2, 4.6, 49, 23, 165, "3 Years", ["Cleaning", "Ironing"], "Flexible maid support for apartments, homes, and family schedules.", "Available Today", 4),
    mock("maid", "Maya Home Service", "Maid", "Subang Jaya, Selangor", 4.0, 4.9, 102, 30, 200, "7 Years", ["Cleaning", "Deep cleaning"], "Top-rated DELLA maid for full home care and recurring visits.", "Available Today", 0),
  ],
  babysitter: [
    mock("babysitter", "Aisyah Babysitter", "Babysitter", "Kuala Lumpur", 3.1, 4.9, 72, 30, 210, "5 Years", ["Toddler care", "Night care"], "Gentle babysitter experienced with toddlers and newborn routines.", "Available Today", 2),
    mock("babysitter", "Nur Babysitting", "Babysitter", "Cheras, Kuala Lumpur", 2.5, 4.8, 64, 28, 195, "4 Years", ["Homework support", "Feeding"], "Trusted childcare provider for daytime and evening support.", "Available Today", 3),
    mock("babysitter", "Lina Child Care", "Babysitter", "Puchong, Selangor", 2.9, 4.7, 51, 29, 205, "6 Years", ["Newborn care", "Toddler care"], "Warm childcare service for babies, toddlers, and school pickups.", "Available Today", 4),
    mock("babysitter", "Sara Baby Care", "Babysitter", "Shah Alam, Selangor", 4.1, 4.8, 47, 27, 188, "3 Years", ["Night care", "Feeding"], "Evening and weekend babysitter with strong parent communication.", "Available Today", 1),
    mock("babysitter", "Mina Kids Support", "Babysitter", "Ampang, Selangor", 3.4, 4.6, 43, 26, 180, "4 Years", ["Homework support", "Toddler care"], "Friendly babysitter for active children and after-school care.", "Available Today", 0),
  ],
  driver: [
    mock("driver", "Driver Kumar", "Driver", "Kuala Lumpur", 2.7, 4.7, 34, 35, 220, "6 Years", ["Airport pickup", "Hourly driver"], "Experienced personal and event driver across Klang Valley.", "Available Today", 4),
    mock("driver", "Azlan Driver Service", "Driver", "Setapak, Kuala Lumpur", 1.9, 4.8, 56, 38, 240, "7 Years", ["Outstation", "Personal driver"], "Safe and punctual driver for airport, city, and long-distance travel.", "Available Today", 3),
    mock("driver", "Ravi Transport", "Driver", "Petaling Jaya, Selangor", 3.0, 4.6, 41, 34, 210, "5 Years", ["Delivery", "Hourly driver"], "Flexible DELLA driver for errands, appointments, and family use.", "Available Today", 2),
    mock("driver", "Hakim Private Driver", "Driver", "Subang Jaya, Selangor", 2.4, 4.9, 77, 40, 250, "8 Years", ["Airport pickup", "Outstation"], "Premium private driver for business and lifestyle bookings.", "Available Today", 1),
    mock("driver", "Muthu Driver Link", "Driver", "Ampang, Selangor", 4.3, 4.7, 52, 33, 205, "4 Years", ["Hourly driver", "Delivery"], "Affordable personal transport and task-based driving service.", "Available Today", 0),
  ],
  cleaner: [
    mock("cleaner", "Nora Cleaner", "Cleaner", "Petaling Jaya, Selangor", 2.2, 4.7, 58, 28, 190, "4 Years", ["Deep cleaning", "Vacuum"], "Trusted cleaner for homes, offices, and move-in sessions.", "Available Today", 0),
    mock("cleaner", "Fresh Home Cleaner", "Cleaner", "Kuala Lumpur", 1.7, 4.8, 69, 29, 195, "5 Years", ["Cleaning", "Deep cleaning"], "Reliable cleaner for weekly maintenance and emergency requests.", "Available Today", 1),
    mock("cleaner", "Spark Clean Service", "Cleaner", "Shah Alam, Selangor", 3.3, 4.6, 44, 26, 175, "3 Years", ["Vacuum", "Laundry"], "Fast, tidy, and professional cleaning support for busy homes.", "Available Today", 2),
    mock("cleaner", "EcoClean Nora", "Cleaner", "Puchong, Selangor", 2.9, 4.8, 51, 27, 185, "6 Years", ["Deep cleaning", "Ironing"], "Eco-focused cleaner using organized routines and clear communication.", "Available Today", 3),
    mock("cleaner", "Daily Shine Cleaner", "Cleaner", "Setapak, Kuala Lumpur", 2.6, 4.7, 47, 25, 170, "4 Years", ["Cleaning", "Vacuum"], "Daily and weekly cleaner available across KL neighborhoods.", "Available Today", 4),
  ],
  tutor: [
    mock("tutor", "Tutor Farah", "Tutor", "Subang Jaya, Selangor", 4.0, 4.8, 63, 45, 260, "5 Years", ["Mathematics", "English"], "Friendly tutor for school support and exam preparation.", "Available Today", 1),
    mock("tutor", "Teacher Aiman", "Tutor", "Kuala Lumpur", 2.3, 4.9, 88, 50, 280, "7 Years", ["Science", "Mathematics"], "Home tutor focused on confidence, clarity, and academic results.", "Available Today", 2),
    mock("tutor", "Ms Priya Tutor", "Tutor", "Cheras, Kuala Lumpur", 2.8, 4.7, 57, 42, 245, "4 Years", ["English", "Tamil"], "Warm and structured tutor for primary and secondary students.", "Available Today", 3),
    mock("tutor", "BM Learning Coach", "Tutor", "Shah Alam, Selangor", 3.6, 4.6, 39, 39, 220, "3 Years", ["BM", "Science"], "At-home tutoring with simple lesson plans and parent updates.", "Available Today", 4),
    mock("tutor", "Math Mentor Lee", "Tutor", "Petaling Jaya, Selangor", 1.9, 4.9, 92, 55, 300, "8 Years", ["Mathematics", "English"], "Experienced DELLA tutor for top-up lessons and exam prep.", "Available Today", 0),
  ],
  plumber: [
    mock("plumber", "Plumber Hafiz", "Plumber", "Cheras, Kuala Lumpur", 3.6, 4.5, 18, 50, 320, "8 Years", ["Pipe repair", "Installation"], "Fast-response plumber for repairs, leaks, and urgent fixes.", "Available Today", 4),
    mock("plumber", "WaterFix Plumber", "Plumber", "Ampang, Selangor", 2.4, 4.8, 51, 55, 350, "9 Years", ["Water leak", "Emergency repair"], "Trusted plumbing support for homes, condos, and offices.", "Available Today", 0),
    mock("plumber", "KL Pipe Service", "Plumber", "Kuala Lumpur", 1.8, 4.7, 43, 48, 310, "6 Years", ["Toilet repair", "Pipe repair"], "Responsive and clean plumbing work with clear pricing.", "Available Today", 1),
    mock("plumber", "Rapid Plumb Care", "Plumber", "Subang Jaya, Selangor", 3.1, 4.6, 35, 52, 330, "5 Years", ["Installation", "Water leak"], "Affordable plumbing service with emergency slots available.", "Available Today", 2),
    mock("plumber", "Home Pipe Expert", "Plumber", "Shah Alam, Selangor", 4.2, 4.8, 64, 58, 360, "10 Years", ["Emergency repair", "Toilet repair"], "Senior plumber for difficult repair jobs and full replacements.", "Available Today", 3),
  ],
  electrician: [
    mock("electrician", "Electrician Azmi", "Electrician", "Ampang, Selangor", 3.6, 4.6, 21, 55, 340, "7 Years", ["Wiring", "Lighting"], "Certified electrician for homes, condos, and small offices.", "Available Today", 2),
    mock("electrician", "BrightFix Electric", "Electrician", "Kuala Lumpur", 2.0, 4.8, 58, 60, 360, "8 Years", ["Socket repair", "Fan installation"], "Safe and detailed electrical service with same-day slots.", "Available Today", 3),
    mock("electrician", "Power Home Azhar", "Electrician", "Setapak, Kuala Lumpur", 2.9, 4.7, 44, 57, 345, "6 Years", ["Lighting", "Wiring"], "Reliable residential electrician for upgrades and troubleshooting.", "Available Today", 4),
    mock("electrician", "Rapid Volt Care", "Electrician", "Petaling Jaya, Selangor", 3.4, 4.9, 71, 62, 380, "9 Years", ["Emergency repair", "Socket repair"], "Top-rated electrical support for urgent home issues.", "Available Today", 0),
    mock("electrician", "Home Current Pro", "Electrician", "Subang Jaya, Selangor", 4.1, 4.7, 52, 58, 350, "5 Years", ["Fan installation", "Lighting"], "Clean installation work with clear pricing and fast support.", "Available Today", 1),
  ],
};

function buildSupabasePublicClient() {
  const url = getSupabaseUrl();
  const publishableKey = getSupabasePublishableKey();

  if (!url || !publishableKey) {
    return null;
  }

  return createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function inferProviderName(serviceKey: ProviderCategoryKey, name: string) {
  const providerNamesByService: Record<ProviderCategoryKey, Record<string, string>> = {
    chef: {
      "Chef Amina": "Amina",
      "Chef Daniel": "Daniel",
      "Chef Mei Ling": "Mei Ling",
      "Chef Hikaru": "Hikaru",
      "Chef Sofia": "Sofia",
    },
    maid: {
      "Siti Maid Service": "Siti",
      "Devi Maid Care": "Devi",
      "Nora Home Help": "Nora",
      "Lina Maid Assist": "Lina",
      "Maya Home Service": "Maya",
    },
    babysitter: {
      "Aisyah Babysitter": "Aisyah",
      "Nur Babysitting": "Nur",
      "Lina Child Care": "Lina",
      "Sara Baby Care": "Sara",
      "Mina Kids Support": "Mina",
    },
    driver: {
      "Driver Kumar": "Kumar",
      "Azlan Driver Service": "Azlan",
      "Ravi Transport": "Ravi",
      "Hakim Private Driver": "Hakim",
      "Muthu Driver Link": "Muthu",
    },
    cleaner: {
      "Nora Cleaner": "Nora",
      "Fresh Home Cleaner": "Fresha",
      "Spark Clean Service": "Indra",
      "EcoClean Nora": "Nimmin",
      "Daily Shine Cleaner": "Rani",
    },
    tutor: {
      "Tutor Farah": "Farah",
      "Teacher Aiman": "Aiman",
      "Ms Priya Tutor": "Priya",
      "BM Learning Coach": "Erina",
      "Math Mentor Lee": "Nadiya",
    },
    plumber: {
      "Plumber Hafiz": "Hafiz",
      "WaterFix Plumber": "Guna",
      "KL Pipe Service": "Karim",
      "Rapid Plumb Care": "Lim",
      "Home Pipe Expert": "Murugan",
    },
    electrician: {
      "Electrician Azmi": "Azmi",
      "BrightFix Electric": "Aweiz",
      "Power Home Azhar": "Shukri",
      "Rapid Volt Care": "Ilango",
      "Home Current Pro": "Asai",
    },
  };

  return providerNamesByService[serviceKey][name];
}

function mock(
  serviceKey: ProviderCategoryKey,
  name: string,
  title: string,
  location: string,
  distanceKm: number,
  rating: number,
  reviews: number,
  hourlyRate: number,
  dailyRate: number,
  yearsExperience: string,
  specialties: string[],
  bio: string,
  availabilityLabel: string,
  imageToneIndex: number
): ProviderListing {
  return {
    id: `mock-${serviceKey}-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    providerName: inferProviderName(serviceKey, name),
    serviceKey,
    serviceLabel: serviceLabels[serviceKey],
    title,
    workMode: ["Live-in", "Part-time", "Full-time"][imageToneIndex % 3] as
      | "Live-in"
      | "Part-time"
      | "Full-time",
    location,
    distanceKm,
    rating,
    reviews,
    hourlyRate,
    dailyRate,
    yearsExperience,
    specialties,
    bio,
    availabilityLabel,
    imageTone: imageTones[imageToneIndex % imageTones.length],
    isApproved: true,
  };
}

function isProviderCategoryKey(value: string): value is ProviderCategoryKey {
  return serviceOrder.includes(value as ProviderCategoryKey);
}

function humanizeService(serviceKey: ProviderCategoryKey) {
  return serviceLabels[serviceKey];
}

export const getProviderCatalog = cache(
  async (service: string | null): Promise<ProviderCatalogData> => {
    const serviceKey = service && isProviderCategoryKey(service) ? service : null;
    const supabase = buildSupabasePublicClient();

    if (!supabase) {
      const fallbackKey = serviceKey ?? "chef";
      return {
        service: serviceKey,
        serviceLabel: serviceKey ? humanizeService(serviceKey) : "All Providers",
        listings: serviceKey ? mockListings[fallbackKey] : Object.values(mockListings).flat().slice(0, 12),
        errorMessage: "Supabase keys are not configured for provider listings yet.",
      };
    }

    const { data, error } = await supabase
      .from("provider_profiles")
      .select(
        `
          id,
          marketing_name,
          service_location,
          average_rating,
          total_reviews,
          bio,
          approval_status,
          provider_verifications (
            email_verified
          ),
          provider_services (
            service_type,
            hourly_rate,
            daily_rate,
            years_experience,
            provider_service_specialties (
              specialty
            )
          )
        `
      )
      .eq("is_visible", true)
      .order("average_rating", { ascending: false });

    const rows = (data ?? []) as ProviderCatalogRow[];

    const realListings = rows
      .flatMap((row, rowIndex) =>
        (row.provider_services ?? []).flatMap((serviceRow) => {
          if (!isProviderCategoryKey(serviceRow.service_type)) {
            return [];
          }

          if (serviceKey && serviceRow.service_type !== serviceKey) {
            return [];
          }

          const verificationRow = Array.isArray(row.provider_verifications)
            ? row.provider_verifications[0]
            : row.provider_verifications;

          return [
            {
              id: row.id,
              name: row.marketing_name ?? "DELLA Provider",
              serviceKey: serviceRow.service_type,
              serviceLabel: humanizeService(serviceRow.service_type),
              title: humanizeService(serviceRow.service_type),
              workMode: (["Live-in", "Part-time", "Full-time"][rowIndex % 3] ??
                "Full-time") as "Live-in" | "Part-time" | "Full-time",
              location: row.service_location ?? "Kuala Lumpur",
              distanceKm: [2.4, 1.8, 3.1, 2.7, 2.2, 4.0, 3.6, 2.9][rowIndex] ?? 2.5,
              rating: Number(row.average_rating ?? 4.8),
              reviews: row.total_reviews ?? 0,
              hourlyRate: Number(serviceRow.hourly_rate ?? 25),
              dailyRate: Number(serviceRow.daily_rate ?? 180),
              yearsExperience: serviceRow.years_experience ?? "New",
              specialties:
                serviceRow.provider_service_specialties
                  ?.map((item) => item.specialty)
                  .filter((item): item is string => Boolean(item))
                  .slice(0, 2) ?? [],
              bio: row.bio ?? "Trusted services available through DELLA.",
              availabilityLabel: "Available Today",
              imageTone: imageTones[rowIndex % imageTones.length],
              isApproved:
                row.approval_status === "approved" &&
                Boolean(verificationRow?.email_verified),
            } satisfies ProviderListing,
          ];
        })
      );

    if (!serviceKey) {
      return {
        service: null,
        serviceLabel: "All Providers",
        listings: [...realListings, ...Object.values(mockListings).flat()].slice(0, 24),
        errorMessage: error?.message ?? null,
      };
    }

    const merged = [...realListings];
    const existingIds = new Set(merged.map((item) => item.id));

    for (const mockItem of mockListings[serviceKey]) {
      if (merged.length >= 5) {
        break;
      }

      if (!existingIds.has(mockItem.id)) {
        merged.push(mockItem);
      }
    }

    return {
      service: serviceKey,
      serviceLabel: humanizeService(serviceKey),
      listings: merged.slice(0, Math.max(5, merged.length)),
      errorMessage: error?.message ?? null,
    };
  }
);
