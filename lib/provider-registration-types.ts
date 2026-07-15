export const providerServices = [
  "Chef",
  "Maid",
  "Tutor",
  "Driver",
  "Cleaner",
  "Babysitter",
  "Plumber",
  "Electrician",
  "Other",
] as const;

export type ProviderService = (typeof providerServices)[number];

export type ProviderServiceDetails = {
  yearsExperience: string;
  specialties: string[];
  imageCaptions: string[];
  imageFileNames: string[];
  imageUrls?: string[];
  certificateCaptions: string[];
  certificateFileNames: string[];
  certificateUrls?: string[];
  hourlyRate: string;
  dailyRate: string;
};

export type ProviderRegistrationData = {
  basicProfile: {
    firstName: string;
    lastName: string;
    sex: "" | "Male" | "Female";
    profileImageName: string;
    profileImageUrl?: string;
    profilePhotoUrl?: string;
    profile_photo_url?: string;
    marketingName: string;
    dateOfBirth: string;
    residentialAddress: string;
    serviceLocation: string;
    serviceRadius: number;
    emergencyContact?: string;
    emergency_contact?: string;
  };
  account: {
    email: string;
    phoneCountryCode: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
  };
  selectedServices: ProviderService[];
  serviceDetails: Record<ProviderService, ProviderServiceDetails>;
  availability: {
    days: string[];
    timePreset: string;
    startTime: string;
    endTime: string;
  };
  providerLocation: {
    radius: number;
    areaLabel: string;
    latitude: number;
    longitude: number;
  };
  verification: {
    phoneOtp: string[];
    emailOtp: string[];
    documentType: string;
    frontImageName: string;
    backImageName: string;
    frontImageUrl?: string;
    backImageUrl?: string;
    identityFrontImageUrl?: string;
    identityBackImageUrl?: string;
  };
};

export type ProviderRegistrationRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: "pending_admin_approval";
  phoneVerified: boolean;
  emailVerified: boolean;
  identityVerified: boolean;
  data: ProviderRegistrationData;
};
