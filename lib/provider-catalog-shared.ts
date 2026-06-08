export const serviceOrder = [
  "chef",
  "maid",
  "babysitter",
  "driver",
  "cleaner",
  "tutor",
  "plumber",
  "electrician",
] as const;

export type ProviderCategoryKey = (typeof serviceOrder)[number];

export function buildProviderDetailHref(listing: {
  id: string;
  serviceKey: ProviderCategoryKey;
}) {
  return `/providers/${encodeURIComponent(listing.id)}?service=${listing.serviceKey}`;
}

export function buildProviderPortraitSrc(listing: {
  serviceKey: ProviderCategoryKey;
  name: string;
}) {
  const slug = listing.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (listing.serviceKey === "chef") {
    return `/Images/Providers/Chef/${slug}.jpg`;
  }

  if (listing.serviceKey === "maid") {
    const maidMap: Record<string, string> = {
      "siti-maid-service": "siti-maid.jpg",
      "devi-maid-care": "devi-maid.jpg",
      "nora-home-help": "nora-maid.jpg",
      "lina-maid-assist": "lina-maid.jpg",
      "maya-home-service": "maya-maid.jpg",
    };

    return `/Images/Providers/maid/${maidMap[slug] ?? "siti-maid.jpg"}`;
  }

  if (listing.serviceKey === "babysitter") {
    const babysitterMap: Record<string, string> = {
      "aisyah-babysitter": "aisha-babysitter.jpg",
      "nur-babysitting": "nur-babysitter.jpg",
      "lina-child-care": "lina-babysitter.jpg",
      "sara-baby-care": "sara-babysitter.jpg",
      "mina-kids-support": "mina-babysitter.jpg",
    };

    return `/Images/Providers/Babysitter/${
      babysitterMap[slug] ?? "aisha-babysitter.jpg"
    }`;
  }

  if (listing.serviceKey === "driver") {
    const driverMap: Record<string, string> = {
      "driver-kumar": "driver-kumar.jpg",
      "azlan-driver-service": "azlan-driver.jpg",
      "ravi-transport": "ravi-driver.jpg",
      "hakim-private-driver": "hakim-driver.jpg",
      "muthu-driver-link": "muthu-driver.jpg",
    };

    return `/Images/Providers/Driver/${driverMap[slug] ?? "driver-kumar.jpg"}`;
  }

  if (listing.serviceKey === "cleaner") {
    const cleanerMap: Record<string, string> = {
      "nora-cleaner": "nora-cleaner.jpg",
      "fresh-home-cleaner": "fresha-cleaner.jpg",
      "spark-clean-service": "indra-cleaner.jpg",
      "ecoclean-nora": "nimmin-cleaner.jpg",
      "daily-shine-cleaner": "rani-cleaner.jpg",
    };

    return `/Images/Providers/Cleaner/${cleanerMap[slug] ?? "nora-cleaner.jpg"}`;
  }

  if (listing.serviceKey === "tutor") {
    const tutorMap: Record<string, string> = {
      "tutor-farah": "Farah-Tutor.jpg",
      "teacher-aiman": "aiman-tutor.jpg",
      "ms-priya-tutor": "priya-titor.jpg",
      "bm-learning-coach": "erina-tutor.jpg",
      "math-mentor-lee": "nadiya-tutor.jpg",
    };

    return `/Images/Providers/Tutor/${tutorMap[slug] ?? "Farah-Tutor.jpg"}`;
  }

  if (listing.serviceKey === "plumber") {
    const plumberMap: Record<string, string> = {
      "plumber-hafiz": "hafiz-plumber.jpg",
      "waterfix-plumber": "guna-plumber.jpg",
      "kl-pipe-service": "karim-plumber.jpg",
      "rapid-plumb-care": "lim-plumber.jpg",
      "home-pipe-expert": "murugan-plumber.jpg",
    };

    return `/Images/Providers/Plumber/${plumberMap[slug] ?? "hafiz-plumber.jpg"}`;
  }

  if (listing.serviceKey === "electrician") {
    const electricianMap: Record<string, string> = {
      "electrician-azmi": "azmin-electrician.jpg",
      "brightfix-electric": "aweiz-electrician.jpg",
      "power-home-azhar": "shukri-electrician.jpg",
      "rapid-volt-care": "ilango-electrician.jpg",
      "home-current-pro": "asai-electrcian.jpg",
    };

    return `/Images/Providers/Electrician/${
      electricianMap[slug] ?? "azmin-electrician.jpg"
    }`;
  }

  return `/api/provider-media/${listing.serviceKey}/portrait`;
}

export function buildCategoryBannerSrc(serviceKey: ProviderCategoryKey | null) {
  if (serviceKey === "chef") {
    return "/images/mock/chef-banner.png";
  }

  if (!serviceKey) {
    return "/images/mock/chef-banner.png";
  }

  return `/api/provider-media/${serviceKey}/gallery-2`;
}
