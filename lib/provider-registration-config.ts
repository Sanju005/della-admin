import type { ProviderRegistrationData, ProviderService } from "./provider-registration-types";

export const serviceSpecialties: Record<ProviderService, string[]> = {
  Chef: ["Arabic", "Malay", "Indian", "Western", "Vegetarian"],
  Maid: ["Cleaning", "Vacuum", "Ironing", "Laundry", "Deep cleaning"],
  Tutor: ["Mathematics", "English", "Science", "BM", "Tamil"],
  Driver: ["Personal driver", "Airport pickup", "Delivery", "Outstation", "Hourly driver"],
  Cleaner: ["Cleaning", "Vacuum", "Ironing", "Laundry", "Deep cleaning"],
  Babysitter: ["Newborn care", "Toddler care", "Feeding", "Homework support", "Night care"],
  Plumber: ["Pipe repair", "Toilet repair", "Water leak", "Installation", "Emergency repair"],
  Electrician: ["Wiring", "Lighting", "Fan installation", "Socket repair", "Emergency repair"],
  Other: ["General help", "On-site support", "Custom requests", "Home visits", "Flexible service"],
};

export const serviceIcons: Record<ProviderService, string> = {
  Chef: "chef",
  Maid: "maid",
  Tutor: "tutor",
  Driver: "driver",
  Cleaner: "cleaner",
  Babysitter: "babysitter",
  Plumber: "plumber",
  Electrician: "electrician",
  Other: "other",
};

export const availabilityDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const timePresets = [
  "Any time",
  "9 AM - 5 PM",
  "8 AM - 8 PM",
  "10 AM - 10 PM",
  "Custom Time",
];

export const documentTypes = [
  "IC / Passport / Driving License",
  "Passport",
  "Driving License",
  "National ID",
];

export const sexOptions = ["Male", "Female"];

export function createEmptyServiceDetails(): ProviderRegistrationData["serviceDetails"] {
  return {
    Chef: {
      yearsExperience: "5 Years",
      specialties: ["Arabic", "Malay", "Indian"],
      imageCaptions: ["Arabic Dish", "Malay Dish", "Indian Dish"],
      imageFileNames: ["", "", ""],
      imageUrls: ["", "", ""],
      certificateCaptions: ["Cert 1", "Cert 2", "Cert 3"],
      certificateFileNames: ["", "", ""],
      certificateUrls: ["", "", ""],
      hourlyRate: "40",
      dailyRate: "250",
    },
    Maid: {
      yearsExperience: "3 Years",
      specialties: ["Cleaning", "Vacuum"],
      imageCaptions: ["Cleaning", "Vacuum", "Ironing"],
      imageFileNames: ["", "", ""],
      imageUrls: ["", "", ""],
      certificateCaptions: ["Cert 1", "Cert 2", "Cert 3"],
      certificateFileNames: ["", "", ""],
      certificateUrls: ["", "", ""],
      hourlyRate: "25",
      dailyRate: "180",
    },
    Tutor: {
      yearsExperience: "4 Years",
      specialties: ["Mathematics", "Science"],
      imageCaptions: ["Math Class", "Science Demo", "Notes"],
      imageFileNames: ["", "", ""],
      imageUrls: ["", "", ""],
      certificateCaptions: ["Degree", "Teaching Cert", "Award"],
      certificateFileNames: ["", "", ""],
      certificateUrls: ["", "", ""],
      hourlyRate: "45",
      dailyRate: "280",
    },
    Driver: {
      yearsExperience: "6 Years",
      specialties: ["Personal driver", "Airport pickup"],
      imageCaptions: ["Sedan", "Airport Pickup", "Trip"],
      imageFileNames: ["", "", ""],
      imageUrls: ["", "", ""],
      certificateCaptions: ["License", "PSV", "Training"],
      certificateFileNames: ["", "", ""],
      certificateUrls: ["", "", ""],
      hourlyRate: "35",
      dailyRate: "220",
    },
    Cleaner: {
      yearsExperience: "4 Years",
      specialties: ["Cleaning", "Deep cleaning"],
      imageCaptions: ["Kitchen", "Living Room", "Bathroom"],
      imageFileNames: ["", "", ""],
      imageUrls: ["", "", ""],
      certificateCaptions: ["Cert 1", "Cert 2", "Cert 3"],
      certificateFileNames: ["", "", ""],
      certificateUrls: ["", "", ""],
      hourlyRate: "28",
      dailyRate: "190",
    },
    Babysitter: {
      yearsExperience: "5 Years",
      specialties: ["Toddler care", "Homework support"],
      imageCaptions: ["Play Time", "Story Time", "Learning"],
      imageFileNames: ["", "", ""],
      imageUrls: ["", "", ""],
      certificateCaptions: ["Childcare", "First Aid", "Safety"],
      certificateFileNames: ["", "", ""],
      certificateUrls: ["", "", ""],
      hourlyRate: "32",
      dailyRate: "230",
    },
    Plumber: {
      yearsExperience: "7 Years",
      specialties: ["Pipe repair", "Installation"],
      imageCaptions: ["Pipe Repair", "Toilet Fix", "Installation"],
      imageFileNames: ["", "", ""],
      imageUrls: ["", "", ""],
      certificateCaptions: ["Trade Cert", "License", "Safety"],
      certificateFileNames: ["", "", ""],
      certificateUrls: ["", "", ""],
      hourlyRate: "55",
      dailyRate: "340",
    },
    Electrician: {
      yearsExperience: "7 Years",
      specialties: ["Wiring", "Lighting"],
      imageCaptions: ["Wiring", "Sockets", "Lighting"],
      imageFileNames: ["", "", ""],
      imageUrls: ["", "", ""],
      certificateCaptions: ["Trade Cert", "License", "Safety"],
      certificateFileNames: ["", "", ""],
      certificateUrls: ["", "", ""],
      hourlyRate: "60",
      dailyRate: "360",
    },
    Other: {
      yearsExperience: "2 Years",
      specialties: ["General help"],
      imageCaptions: ["Work 1", "Work 2", "Work 3"],
      imageFileNames: ["", "", ""],
      imageUrls: ["", "", ""],
      certificateCaptions: ["Cert 1", "Cert 2", "Cert 3"],
      certificateFileNames: ["", "", ""],
      certificateUrls: ["", "", ""],
      hourlyRate: "30",
      dailyRate: "200",
    },
  };
}

export function createDefaultProviderRegistration(): ProviderRegistrationData {
  return {
    basicProfile: {
      firstName: "Amina",
      lastName: "Khalid",
      sex: "Female",
      profileImageName: "",
      profileImageUrl: "",
      marketingName: "Ex Chef Amina",
      dateOfBirth: "15/04/1995",
      residentialAddress: "No. 123, Jalan Mutiara, 43000 Kajang.",
      serviceLocation: "Kajang, Selangor",
      serviceRadius: 15,
      emergencyContact: "",
    },
    account: {
      email: "amina@email.com",
      phoneCountryCode: "+60",
      phoneNumber: "12-345 6789",
      password: "password123",
      confirmPassword: "password123",
    },
    selectedServices: ["Chef", "Maid"],
    serviceDetails: createEmptyServiceDetails(),
    availability: {
      days: [...availabilityDays],
      timePreset: "8 AM - 8 PM",
      startTime: "08:00 AM",
      endTime: "08:00 PM",
    },
    providerLocation: {
      radius: 15,
      areaLabel: "Kajang, Selangor",
      latitude: 3.1274,
      longitude: 101.7452,
    },
    verification: {
      phoneOtp: ["1", "2", "3", "4", "5", "6"],
      emailOtp: ["1", "2", "3", "4", "5", "6"],
      documentType: documentTypes[0],
      frontImageName: "",
      backImageName: "",
      frontImageUrl: "",
      backImageUrl: "",
    },
  };
}
