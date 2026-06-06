import "server-only";

import { cache } from "react";
import {
  buildProviderDetailHref,
  buildProviderPortraitSrc,
  getProviderCatalog,
  type ProviderCategoryKey,
  type ProviderListing,
} from "./provider-catalog";

type ProviderGalleryImage = {
  src: string;
  alt: string;
  caption: string;
};

export type ProviderAvailabilitySlot = {
  dayLabel: string;
  dateLabel: string;
  timeLabel: string;
  state: "available" | "booked";
};

type ProviderCustomerReview = {
  id: string;
  customerName: string;
  rating: number;
  postedLabel: string;
  comment: string;
  images: string[];
};

export type ProviderCalendarDate = {
  isoDate: string;
  dayNumber: number;
  weekdayShort: string;
  state: "available" | "booked";
};

export type ProviderDetail = ProviderListing & {
  href: string;
  profileImage: string;
  title: string;
  reviewsLabel: string;
  jobsCompleted: number;
  locationFull: string;
  online: boolean;
  verified: boolean;
  backgroundChecked: boolean;
  about: string;
  gallery: ProviderGalleryImage[];
  availability: ProviderAvailabilitySlot[];
  calendarMonthLabel: string;
  calendarDates: ProviderCalendarDate[];
  customerReviews: ProviderCustomerReview[];
};

const providerDescriptions: Record<ProviderCategoryKey, string> = {
  chef:
    "Passionate chef with years of experience preparing fresh meals for daily dining, special family gatherings, and private events. DELLA customers book this chef for trusted home cooking, flexible menus, and warm service.",
  maid:
    "Reliable maid focused on keeping homes comfortable, clean, and well-organized. Suitable for regular cleaning routines, laundry support, and calm day-to-day household care.",
  babysitter:
    "Caring babysitter experienced with babies, toddlers, and school-age children. Families choose this provider for safe routines, patient supervision, and dependable support.",
  driver:
    "Professional driver for airport transfers, city trips, school runs, and planned daily schedules. Known for punctual service, safe driving, and clear communication.",
  cleaner:
    "Detail-oriented cleaner for apartments, homes, and deeper weekend resets. DELLA users book this provider for neat results, flexible hours, and consistent service quality.",
  tutor:
    "Friendly tutor offering structured learning support, patient explanations, and practical study routines. Suitable for one-to-one sessions and steady weekly improvement.",
  plumber:
    "Experienced plumber available for urgent leaks, installation work, and repair visits. Chosen for responsive communication, practical solutions, and reliable workmanship.",
  electrician:
    "Certified electrician for home maintenance, new installations, and troubleshooting. DELLA customers use this provider for clear pricing, safe fixes, and careful service.",
};

const galleryCaptions: Record<ProviderCategoryKey, [string, string, string]> = {
  chef: [
    "Homemade with fresh ingredients",
    "Authentic flavors, made with love",
    "Perfect for every occasion",
  ],
  maid: [
    "Fresh spaces, carefully maintained",
    "Detailed cleaning for busy homes",
    "Comfort and order every visit",
  ],
  babysitter: [
    "Warm care in a safe routine",
    "Play, support, and attention",
    "Trusted help for family schedules",
  ],
  driver: [
    "Comfortable rides across the city",
    "Reliable transport for daily plans",
    "Safe and punctual travel support",
  ],
  cleaner: [
    "Spotless rooms, refreshed daily",
    "Deep cleaning with care",
    "Bright results you can feel",
  ],
  tutor: [
    "Focused lessons that build confidence",
    "Learning plans made simple",
    "Steady progress for every student",
  ],
  plumber: [
    "Fast fixes for urgent repairs",
    "Clean installation and maintenance",
    "Solutions that keep homes running",
  ],
  electrician: [
    "Safe electrical work for the home",
    "Lighting, sockets, and upgrades",
    "Professional service you can trust",
  ],
};

const specialtyDefaults: Record<ProviderCategoryKey, string[]> = {
  chef: ["Malay", "Arabic", "Western", "Indian", "Asian", "Healthy Meals"],
  maid: ["Cleaning", "Laundry", "Ironing", "Deep Cleaning", "Kitchen Care", "Weekly Service"],
  babysitter: ["Toddler Care", "Newborn Care", "Night Care", "Homework Help", "Meal Support", "School Pickup"],
  driver: ["Airport Pickup", "Hourly Driver", "Outstation", "School Runs", "Event Trips", "Errands"],
  cleaner: ["Deep Cleaning", "Vacuum", "Kitchen Cleaning", "Bathroom Care", "Move-in Reset", "Weekly Service"],
  tutor: ["Mathematics", "English", "Science", "Reading", "Homework Help", "Exam Prep"],
  plumber: ["Pipe Repair", "Leak Fix", "Installation", "Toilet Repair", "Kitchen Plumbing", "Emergency Callout"],
  electrician: ["Wiring", "Lighting", "Socket Repair", "Fan Installation", "Troubleshooting", "Home Upgrades"],
};

function titleForService(serviceKey: ProviderCategoryKey) {
  switch (serviceKey) {
    case "chef":
      return "Professional Chef";
    case "maid":
      return "Professional Maid";
    case "babysitter":
      return "Trusted Babysitter";
    case "driver":
      return "Personal Driver";
    case "cleaner":
      return "Home Cleaner";
    case "tutor":
      return "Private Tutor";
    case "plumber":
      return "Licensed Plumber";
    case "electrician":
      return "Certified Electrician";
  }
}

function providerMediaUrl(serviceKey: ProviderCategoryKey, kind: string) {
  return `/api/provider-media/${serviceKey}/${kind}`;
}

function buildAvailability(serviceKey: ProviderCategoryKey): ProviderAvailabilitySlot[] {
  const defaults: Record<ProviderCategoryKey, string[]> = {
    chef: ["2:00 PM", "10:00 AM", "10:00 AM", "10:00 AM", "10:00 AM", "Booked", "1:00 PM"],
    maid: ["9:00 AM", "9:00 AM", "8:00 AM", "9:00 AM", "9:00 AM", "Booked", "10:00 AM"],
    babysitter: ["8:00 AM", "10:00 AM", "10:00 AM", "11:00 AM", "10:00 AM", "Booked", "8:00 AM"],
    driver: ["7:00 AM", "8:00 AM", "8:00 AM", "9:00 AM", "8:00 AM", "Booked", "7:00 AM"],
    cleaner: ["9:00 AM", "9:00 AM", "8:00 AM", "11:00 AM", "9:00 AM", "Booked", "10:00 AM"],
    tutor: ["3:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "3:00 PM", "Booked", "2:00 PM"],
    plumber: ["9:00 AM", "9:00 AM", "9:00 AM", "10:00 AM", "9:00 AM", "Booked", "11:00 AM"],
    electrician: ["9:00 AM", "9:00 AM", "9:00 AM", "10:00 AM", "9:00 AM", "Booked", "11:00 AM"],
  };

  const days = [
    ["Mon", "Jun 2"],
    ["Tue", "Jun 3"],
    ["Wed", "Jun 4"],
    ["Thu", "Jun 5"],
    ["Fri", "Jun 6"],
    ["Sat", "Jun 7"],
    ["Sun", "Jun 8"],
  ] as const;

  return days.map(([dayLabel, dateLabel], index) => {
    const timeLabel = defaults[serviceKey][index] ?? "10:00 AM";
    return {
      dayLabel,
      dateLabel,
      timeLabel,
      state: timeLabel.toLowerCase().includes("booked") ? "booked" : "available",
    };
  });
}

function buildCalendarDates(serviceKey: ProviderCategoryKey): {
  monthLabel: string;
  dates: ProviderCalendarDate[];
} {
  const monthBase = new Date();
  const year = monthBase.getFullYear();
  const month = monthBase.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const bookedByService: Record<ProviderCategoryKey, number[]> = {
    chef: [4, 10, 16, 22, 29],
    maid: [6, 12, 18, 24, 28],
    babysitter: [5, 11, 17, 23, 30],
    driver: [3, 8, 15, 21, 27],
    cleaner: [2, 9, 14, 20, 26],
    tutor: [7, 13, 19, 25],
    plumber: [1, 6, 12, 18, 24],
    electrician: [5, 10, 16, 22, 28],
  };

  const dates: ProviderCalendarDate[] = Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1;
    const date = new Date(year, month, dayNumber);
    return {
      isoDate: `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`,
      dayNumber,
      weekdayShort: date.toLocaleDateString("en-MY", { weekday: "short" }),
      state: bookedByService[serviceKey].includes(dayNumber) ? "booked" : "available",
    };
  });

  return {
    monthLabel: new Date(year, month, 1).toLocaleDateString("en-MY", {
      month: "long",
      year: "numeric",
    }),
    dates,
  };
}

function mergeSpecialties(listing: ProviderListing) {
  const combined = [...listing.specialties, ...specialtyDefaults[listing.serviceKey]];
  return [...new Set(combined)].slice(0, 6);
}

function buildCustomerReviews(listing: ProviderListing): ProviderCustomerReview[] {
  const imageA = buildProviderPortraitSrc(listing);
  const imageB = providerMediaUrl(listing.serviceKey, "gallery-1");
  const imageC = providerMediaUrl(listing.serviceKey, "gallery-2");

  const reviewCopy: Record<ProviderCategoryKey, [string, string, string]> = {
    chef: [
      "The food was fresh, nicely presented, and tasted just like a private dining experience at home.",
      "Chef arrived on time, kept the kitchen clean, and adjusted the menu for our family preferences.",
      "Booked for a small birthday dinner and everyone loved the dishes. Would definitely book again.",
    ],
    maid: [
      "Very tidy work and the whole house felt fresh after the session.",
      "Laundry and kitchen were handled carefully. Communication was also very easy.",
      "Good attention to detail and arrived exactly on time.",
    ],
    babysitter: [
      "Very patient with my child and kept a calm routine throughout the evening.",
      "Shared updates during the booking and made us feel comfortable leaving home.",
      "Friendly, responsible, and easy for the kids to warm up to.",
    ],
    driver: [
      "Smooth ride, punctual arrival, and very professional throughout the trip.",
      "Helped with bags and kept us updated before pickup.",
      "Safe driving and easy communication. Great overall service.",
    ],
    cleaner: [
      "Bathrooms and kitchen were spotless. Really happy with the result.",
      "Came prepared and worked efficiently without rushing the details.",
      "The home looked refreshed and organized after the cleaning session.",
    ],
    tutor: [
      "Explains clearly and helped my child feel more confident with the subject.",
      "Lesson was structured well and easy to follow from start to finish.",
      "Very patient teaching style and useful feedback after class.",
    ],
    plumber: [
      "Solved the issue quickly and explained what caused the leak.",
      "Brought the right tools and kept the work area neat.",
      "Responsive, practical, and the repair has been holding up well.",
    ],
    electrician: [
      "Clear explanation, careful work, and everything was tested before leaving.",
      "Installed the fittings neatly and arrived on time.",
      "Professional service and good communication throughout the visit.",
    ],
  };

  const [first, second, third] = reviewCopy[listing.serviceKey];

  return [
    {
      id: `${listing.id}-review-1`,
      customerName: "Nurul S.",
      rating: Number(listing.rating.toFixed(1)),
      postedLabel: "2 days ago",
      comment: first,
      images: [imageB, imageC],
    },
    {
      id: `${listing.id}-review-2`,
      customerName: "Farid K.",
      rating: Math.max(4.6, listing.rating - 0.1),
      postedLabel: "1 week ago",
      comment: second,
      images: [imageA],
    },
    {
      id: `${listing.id}-review-3`,
      customerName: "Amanda L.",
      rating: Math.max(4.7, listing.rating),
      postedLabel: "2 weeks ago",
      comment: third,
      images: [imageC, imageA],
    },
  ];
}

function buildDetailFromListing(listing: ProviderListing): ProviderDetail {
  const captions = galleryCaptions[listing.serviceKey];
  const calendar = buildCalendarDates(listing.serviceKey);

  return {
    ...listing,
    href: buildProviderDetailHref(listing),
    title: titleForService(listing.serviceKey),
    profileImage: buildProviderPortraitSrc(listing),
    reviewsLabel: `${listing.rating.toFixed(1)} (${listing.reviews} reviews)`,
    jobsCompleted: Math.max(listing.reviews, 12),
    locationFull: `${listing.location}, Malaysia`,
    online: true,
    verified: listing.isApproved,
    backgroundChecked: listing.isApproved,
    about: providerDescriptions[listing.serviceKey],
    specialties: mergeSpecialties(listing),
    gallery: [
      {
        src: providerMediaUrl(listing.serviceKey, "gallery-1"),
        alt: `${listing.name} gallery image 1`,
        caption: captions[0],
      },
      {
        src: providerMediaUrl(listing.serviceKey, "gallery-2"),
        alt: `${listing.name} gallery image 2`,
        caption: captions[1],
      },
      {
        src: providerMediaUrl(listing.serviceKey, "gallery-3"),
        alt: `${listing.name} gallery image 3`,
        caption: captions[2],
      },
    ],
    availability: buildAvailability(listing.serviceKey),
    calendarMonthLabel: calendar.monthLabel,
    calendarDates: calendar.dates,
    customerReviews: buildCustomerReviews(listing),
  };
}

export const getProviderDetail = cache(
  async (id: string, service: string | null): Promise<ProviderDetail | null> => {
    const scopedCatalog = await getProviderCatalog(service);
    const scopedMatch = scopedCatalog.listings.find((listing) => listing.id === id);

    if (scopedMatch) {
      return buildDetailFromListing(scopedMatch);
    }

    const allCatalog = await getProviderCatalog(null);
    const fallbackMatch = allCatalog.listings.find((listing) => listing.id === id);

    if (!fallbackMatch) {
      return null;
    }

    return buildDetailFromListing(fallbackMatch);
  }
);
