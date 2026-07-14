import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createAdminManagedAccount,
  type CreateAccountInput,
  type ProviderDocumentUploadInput,
  type ProviderServiceCreateInput,
  type UploadedAssetInput,
} from "../lib/admin-account-creation";

type AccountCreatePageProps = {
  accountType: "customer" | "provider";
};

type UploadedAsset = {
  fileName: string;
  dataUrl: string;
  caption: string;
};

type ProviderServiceForm = {
  id: string;
  serviceType: string;
  customServiceType: string;
  serviceLocation: string;
  serviceRadiusKm: string;
  yearsExperience: string;
  hourlyRate: string;
  dailyRate: string;
  workImages: UploadedAsset[];
};

type CropDraft = {
  fileName: string;
  imageSrc: string;
  scale: number;
  offsetX: number;
  offsetY: number;
  imageWidth: number;
  imageHeight: number;
  aspectRatio: number | null;
  trimLeft: number;
  trimRight: number;
  trimTop: number;
  trimBottom: number;
  target:
    | { kind: "profile" }
    | { kind: "identityFront" }
    | { kind: "identityBack" }
    | { kind: "service"; serviceId: string };
  remainingFiles: Array<{
    fileName: string;
    imageSrc: string;
    imageWidth: number;
    imageHeight: number;
  }>;
};

const availabilityDayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const providerServiceOptions = [
  "Chef",
  "Maid",
  "Driver",
  "Tutor",
  "Babysitter",
  "Home Cleaning",
  "Plumbing",
  "Electrician",
  "Other",
];

const identityDocumentOptions = [
  "IC",
  "Passport",
  "Driving License",
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="space-y-2 text-sm font-medium text-slate-700">{children}</label>;
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 ${props.className ?? ""}`}
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 ${props.className ?? ""}`}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 ${props.className ?? ""}`}
    />
  );
}

function emptyProviderService(): ProviderServiceForm {
  return {
    id: crypto.randomUUID(),
    serviceType: "",
    customServiceType: "",
    serviceLocation: "",
    serviceRadiusKm: "",
    yearsExperience: "",
    hourlyRate: "",
    dailyRate: "",
    workImages: [],
  };
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

async function toCropSource(file: File) {
  const imageSrc = await readFileAsDataUrl(file);
  const image = await loadImageElement(imageSrc);

  return {
    fileName: file.name,
    imageSrc,
    imageWidth: image.width,
    imageHeight: image.height,
  };
}

async function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image."));
    image.src = src;
  });
}

async function cropImageToSquare(
  src: string,
  scale: number,
  offsetX: number,
  offsetY: number,
  outputSize = 640,
) {
  const image = await loadImageElement(src);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not available.");
  }

  const baseSize = Math.min(image.width, image.height);
  const cropSize = Math.max(80, baseSize / Math.max(scale, 1));
  const maxX = Math.max(0, image.width - cropSize);
  const maxY = Math.max(0, image.height - cropSize);
  const originX = Math.min(maxX, Math.max(0, (image.width - cropSize) / 2 + offsetX));
  const originY = Math.min(maxY, Math.max(0, (image.height - cropSize) / 2 + offsetY));

  context.drawImage(
    image,
    originX,
    originY,
    cropSize,
    cropSize,
    0,
    0,
    outputSize,
    outputSize,
  );

  return canvas.toDataURL("image/jpeg", 0.92);
}

async function cropImageToRect(
  src: string,
  originX: number,
  originY: number,
  cropWidth: number,
  cropHeight: number,
  outputWidth = 640,
  outputHeight = 640,
) {
  const image = await loadImageElement(src);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not available.");
  }

  context.drawImage(
    image,
    originX,
    originY,
    cropWidth,
    cropHeight,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  return canvas.toDataURL("image/jpeg", 0.92);
}

function getCropMetrics(draft: CropDraft) {
  if (draft.aspectRatio) {
    const baseCropHeight = Math.min(draft.imageWidth / draft.aspectRatio, draft.imageHeight);
    const cropHeight = Math.max(80, baseCropHeight / Math.max(draft.scale, 1));
    const cropWidth = cropHeight * draft.aspectRatio;
    const maxX = Math.max(0, draft.imageWidth - cropWidth);
    const maxY = Math.max(0, draft.imageHeight - cropHeight);
    const centeredX = (draft.imageWidth - cropWidth) / 2;
    const centeredY = (draft.imageHeight - cropHeight) / 2;

    return {
      cropWidth,
      cropHeight,
      maxX,
      maxY,
      centeredX,
      centeredY,
      originX: Math.min(maxX, Math.max(0, centeredX + draft.offsetX)),
      originY: Math.min(maxY, Math.max(0, centeredY + draft.offsetY)),
      aspectRatio: draft.aspectRatio,
    };
  }

  const minSize = 80;
  const trimLeft = Math.max(0, draft.trimLeft);
  const trimRight = Math.max(0, Math.min(draft.trimRight, draft.imageWidth - minSize - trimLeft));
  const left = Math.min(trimLeft, draft.imageWidth - minSize - trimRight);
  const width = Math.max(minSize, draft.imageWidth - left - trimRight);

  const trimTop = Math.max(0, draft.trimTop);
  const trimBottom = Math.max(0, Math.min(draft.trimBottom, draft.imageHeight - minSize - trimTop));
  const top = Math.min(trimTop, draft.imageHeight - minSize - trimBottom);
  const height = Math.max(minSize, draft.imageHeight - top - trimBottom);

  return {
    cropWidth: width,
    cropHeight: height,
    maxX: draft.imageWidth - minSize,
    maxY: draft.imageHeight - minSize,
    centeredX: 0,
    centeredY: 0,
    originX: left,
    originY: top,
    aspectRatio: width / height,
  };
}

function clampCropDraft(draft: CropDraft): CropDraft {
  const metrics = getCropMetrics(draft);

  if (draft.aspectRatio) {
    const minOffsetX = -metrics.centeredX;
    const maxOffsetX = metrics.maxX - metrics.centeredX;
    const minOffsetY = -metrics.centeredY;
    const maxOffsetY = metrics.maxY - metrics.centeredY;

    return {
      ...draft,
      offsetX: Math.min(maxOffsetX, Math.max(minOffsetX, draft.offsetX)),
      offsetY: Math.min(maxOffsetY, Math.max(minOffsetY, draft.offsetY)),
      trimLeft: 0,
      trimRight: 0,
      trimTop: 0,
      trimBottom: 0,
    };
  }

  const minSize = 80;
  const trimLeft = Math.max(0, Math.min(draft.trimLeft, draft.imageWidth - minSize));
  const trimRight = Math.max(0, Math.min(draft.trimRight, draft.imageWidth - minSize - trimLeft));
  const trimTop = Math.max(0, Math.min(draft.trimTop, draft.imageHeight - minSize));
  const trimBottom = Math.max(0, Math.min(draft.trimBottom, draft.imageHeight - minSize - trimTop));

  return {
    ...draft,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    trimLeft,
    trimRight,
    trimTop,
    trimBottom,
  };
}

function getCropPreviewStyle(draft: CropDraft, frameSize: number) {
  const normalizedDraft = clampCropDraft(draft);
  const metrics = getCropMetrics(normalizedDraft);
  const previewScale = frameSize / metrics.cropWidth;
  const originX = metrics.originX;
  const originY = metrics.originY;

  return {
    previewScale,
    style: {
      width: `${normalizedDraft.imageWidth * previewScale}px`,
      height: `${normalizedDraft.imageHeight * previewScale}px`,
      transform: `translate(${-originX * previewScale}px, ${-originY * previewScale}px)`,
      transformOrigin: "top left",
    },
  };
}

function UploadedAssetCard({
  asset,
  title,
  onCaptionChange,
  onRemove,
}: {
  asset: UploadedAsset;
  title: string;
  onCaptionChange?: (value: string) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <img src={asset.dataUrl} alt={asset.fileName} className="h-36 w-full object-cover" />
      </div>
      <p className="mt-3 truncate text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 truncate text-xs text-slate-500">{asset.fileName}</p>
      {onCaptionChange ? (
        <TextInput
          value={asset.caption}
          onChange={(event) => onCaptionChange(event.target.value)}
          placeholder="Caption"
          className="mt-3"
        />
      ) : null}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="mt-3 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700"
        >
          Remove
        </button>
      ) : null}
    </div>
  );
}

export function AccountCreatePage({ accountType }: AccountCreatePageProps) {
  const navigate = useNavigate();
  const isProvider = accountType === "provider";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    status: isProvider ? "pending" : "active",
    dob: "",
    gender: "",
    city: "",
    region: "",
    country: "Malaysia",
    marketingName: "",
    address: "",
    bio: "",
    availabilityPreset: "",
    availabilityStartTime: "",
    availabilityEndTime: "",
    approvalStatus: "pending",
    visible: false,
    emailVerified: true,
    phoneVerified: false,
    identityVerified: false,
    kycVerified: false,
    backgroundCheckVerified: false,
    identityDocumentType: "IC",
  });
  const [availabilityDays, setAvailabilityDays] = useState<string[]>([]);
  const [services, setServices] = useState<ProviderServiceForm[]>([emptyProviderService()]);
  const [profilePhoto, setProfilePhoto] = useState<UploadedAsset | null>(null);
  const [identityFront, setIdentityFront] = useState<UploadedAsset | null>(null);
  const [identityBack, setIdentityBack] = useState<UploadedAsset | null>(null);
  const [cropDraft, setCropDraft] = useState<CropDraft | null>(null);

  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const identityFrontInputRef = useRef<HTMLInputElement | null>(null);
  const identityBackInputRef = useRef<HTMLInputElement | null>(null);
  const serviceFileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const cropPreviewRef = useRef<HTMLDivElement | null>(null);
  const cropDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);

  const needsIdentityBack = useMemo(
    () => form.identityDocumentType !== "Passport",
    [form.identityDocumentType],
  );
  const cropBounds = useMemo(() => {
    if (!cropDraft) {
      return null;
    }

    const normalizedDraft = clampCropDraft(cropDraft);
    const metrics = getCropMetrics(normalizedDraft);

    return {
      minOffsetX: -metrics.centeredX,
      maxOffsetX: metrics.maxX - metrics.centeredX,
      minOffsetY: -metrics.centeredY,
      maxOffsetY: metrics.maxY - metrics.centeredY,
    };
  }, [cropDraft]);

  function updateField(key: string, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateService(
    serviceId: string,
    updates: Partial<ProviderServiceForm>,
  ) {
    setServices((current) =>
      current.map((service) => (service.id === serviceId ? { ...service, ...updates } : service)),
    );
  }

  function toggleAvailabilityDay(day: string) {
    setAvailabilityDays((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day],
    );
  }

  function addService() {
    setServices((current) => [...current, emptyProviderService()]);
  }

  function removeService(serviceId: string) {
    setServices((current) => (current.length > 1 ? current.filter((service) => service.id !== serviceId) : current));
  }

  function openCropDraft(
    source: {
      fileName: string;
      imageSrc: string;
      imageWidth: number;
      imageHeight: number;
    },
    target: CropDraft["target"],
    aspectRatio: number | null,
    remainingFiles: CropDraft["remainingFiles"] = [],
  ) {
    setCropDraft(
      clampCropDraft({
        ...source,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        aspectRatio,
        trimLeft: 0,
        trimRight: 0,
        trimTop: 0,
        trimBottom: 0,
        target,
        remainingFiles,
      }),
    );
  }

  function applyCroppedAsset(
    target: CropDraft["target"],
    asset: UploadedAsset,
  ) {
    if (target.kind === "profile") {
      setProfilePhoto(asset);
      return;
    }

    if (target.kind === "identityFront") {
      setIdentityFront(asset);
      return;
    }

    if (target.kind === "identityBack") {
      setIdentityBack(asset);
      return;
    }

    setServices((current) =>
      current.map((service) =>
        service.id === target.serviceId
          ? { ...service, workImages: [...service.workImages, asset].slice(0, 6) }
          : service,
      ),
    );
  }

  async function handleProfileImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const source = await toCropSource(file);
    openCropDraft(source, { kind: "profile" }, 1);
  }

  async function applyProfileCrop() {
    if (!cropDraft) {
      return;
    }

    const normalizedDraft = clampCropDraft(cropDraft);
    const metrics = getCropMetrics(normalizedDraft);
    const outputHeight = normalizedDraft.aspectRatio === 2 ? 640 : 640;
    const outputWidth =
      normalizedDraft.aspectRatio === null ? Math.round(640 * metrics.aspectRatio) : Math.round(outputHeight * metrics.aspectRatio);
    const dataUrl = await cropImageToRect(
      normalizedDraft.imageSrc,
      metrics.originX,
      metrics.originY,
      metrics.cropWidth,
      metrics.cropHeight,
      outputWidth,
      outputHeight,
    );

    applyCroppedAsset(normalizedDraft.target, {
      fileName: normalizedDraft.fileName,
      dataUrl,
      caption:
        normalizedDraft.target.kind === "profile"
          ? "Profile image"
          : normalizedDraft.fileName.replace(/\.[^.]+$/, ""),
    });

    const nextFile = normalizedDraft.remainingFiles[0];
    if (nextFile) {
      openCropDraft(
        nextFile,
        normalizedDraft.target,
        normalizedDraft.aspectRatio,
        normalizedDraft.remainingFiles.slice(1),
      );
      return;
    }

    setCropDraft(null);
  }

  function updateCropDraft(patch: Partial<CropDraft>) {
    setCropDraft((current) => (current ? clampCropDraft({ ...current, ...patch }) : current));
  }

  function handleCropPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!cropDraft) {
      return;
    }

    cropDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: cropDraft.offsetX,
      startOffsetY: cropDraft.offsetY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleCropPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!cropDraft || !cropDragRef.current || cropDragRef.current.pointerId !== event.pointerId) {
      return;
    }

    const frameSize = cropPreviewRef.current?.getBoundingClientRect().width ?? 420;
    const { previewScale } = getCropPreviewStyle(cropDraft, frameSize);
    const deltaX = (event.clientX - cropDragRef.current.startX) / Math.max(previewScale, 0.0001);
    const deltaY = (event.clientY - cropDragRef.current.startY) / Math.max(previewScale, 0.0001);

    setCropDraft((current) =>
      current
        ? clampCropDraft({
            ...current,
            offsetX: cropDragRef.current!.startOffsetX - deltaX,
            offsetY: cropDragRef.current!.startOffsetY - deltaY,
          })
        : current,
    );
  }

  function handleCropPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (cropDragRef.current?.pointerId === event.pointerId) {
      cropDragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  async function handleSimpleImageUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    target: CropDraft["target"],
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const source = await toCropSource(file);
    openCropDraft(source, target, null);
  }

  async function handleServiceImagesUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    serviceId: string,
  ) {
    const fileList = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!fileList.length) {
      return;
    }

    const [firstFile, ...remainingQueue] = await Promise.all(fileList.map(toCropSource));
    if (!firstFile) {
      return;
    }
    openCropDraft(firstFile, { kind: "service", serviceId }, 2, remainingQueue);
  }

  function buildUploadedAsset(asset: UploadedAsset): UploadedAssetInput {
    return {
      fileName: asset.fileName,
      dataUrl: asset.dataUrl,
      caption: asset.caption.trim() || asset.fileName,
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = form.fullName.trim();
    const trimmedEmail = form.email.trim();
    const trimmedPassword = form.password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      setError("Full name, email, and password are required.");
      return;
    }

    if (isProvider) {
      const validServices = services.filter((service) => {
        const selectedType =
          service.serviceType === "Other" ? service.customServiceType.trim() : service.serviceType.trim();
        return Boolean(selectedType);
      });

      if (!validServices.length) {
        setError("At least one provider service is required.");
        return;
      }
    }

    const providerServices: ProviderServiceCreateInput[] = isProvider
      ? services.reduce<ProviderServiceCreateInput[]>((collection, service) => {
          const selectedType =
            service.serviceType === "Other" ? service.customServiceType.trim() : service.serviceType.trim();

          if (!selectedType) {
            return collection;
          }

          collection.push({
            serviceType: selectedType,
            serviceLocation: service.serviceLocation.trim() || undefined,
            serviceRadiusKm: service.serviceRadiusKm ? Number(service.serviceRadiusKm) : undefined,
            yearsExperience: service.yearsExperience.trim() || undefined,
            hourlyRate: service.hourlyRate ? Number(service.hourlyRate) : undefined,
            dailyRate: service.dailyRate ? Number(service.dailyRate) : undefined,
            workImages: service.workImages.map(buildUploadedAsset),
          });

          return collection;
        }, [])
      : [];

    const documents: ProviderDocumentUploadInput[] = isProvider
      ? [
          ...(identityFront
            ? [
                {
                  documentType: `${form.identityDocumentType.toLowerCase().replace(/\s+/g, "_")}_front`,
                  label: `${form.identityDocumentType} Front`,
                  status: "Pending",
                  file: buildUploadedAsset(identityFront),
                },
              ]
            : []),
          ...(identityBack
            ? [
                {
                  documentType: `${form.identityDocumentType.toLowerCase().replace(/\s+/g, "_")}_back`,
                  label: `${form.identityDocumentType} Back`,
                  status: "Pending",
                  file: buildUploadedAsset(identityBack),
                },
              ]
            : []),
        ]
      : [];

    const payload: CreateAccountInput = isProvider
      ? {
          accountType: "provider",
          fullName: trimmedName,
          email: trimmedEmail,
          password: trimmedPassword,
          phone: form.phone.trim() || undefined,
          status: form.status,
          dob: form.dob || undefined,
          gender: form.gender || undefined,
          city: form.city.trim() || undefined,
          region: form.region.trim() || undefined,
          country: form.country.trim() || undefined,
          marketingName: form.marketingName.trim() || undefined,
          profilePhoto: profilePhoto ? buildUploadedAsset(profilePhoto) : undefined,
          address: form.address.trim() || undefined,
          bio: form.bio.trim() || undefined,
          availabilityDays,
          availabilityPreset: form.availabilityPreset.trim() || undefined,
          availabilityStartTime: form.availabilityStartTime || undefined,
          availabilityEndTime: form.availabilityEndTime || undefined,
          approvalStatus: form.approvalStatus,
          visible: form.visible,
          emailVerified: form.emailVerified,
          phoneVerified: form.phoneVerified,
          identityVerified: form.identityVerified,
          kycVerified: form.kycVerified,
          backgroundCheckVerified: form.backgroundCheckVerified,
          identityDocumentType: form.identityDocumentType,
          services: providerServices,
          documents,
        }
      : {
          accountType: "customer",
          fullName: trimmedName,
          email: trimmedEmail,
          password: trimmedPassword,
          phone: form.phone.trim() || undefined,
          status: form.status,
          dob: form.dob || undefined,
          gender: form.gender || undefined,
          city: form.city.trim() || undefined,
          region: form.region.trim() || undefined,
          country: form.country.trim() || undefined,
        };

    setSaving(true);
    setError(null);

    const result = await createAdminManagedAccount(payload);

    setSaving(false);

    if (result.error || !result.userId) {
      setError(result.error || "Unable to create account.");
      return;
    }

    navigate(isProvider ? `/service-providers/${result.userId}` : `/users/${result.userId}`);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(16,24,40,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-950">
              {isProvider ? "Create Service Provider" : "Create User"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Create a real app account from admin. After save, the new {isProvider ? "provider" : "user"} can sign in from the app with this email and password.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(isProvider ? "/service-providers" : "/users")}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Back
          </button>
        </div>
      </section>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
        <section className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(16,24,40,0.08)]">
          <h2 className="text-lg font-bold text-slate-950">Account Details</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FieldLabel>
              <span>Full Name</span>
              <TextInput value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} placeholder="Enter full name" required />
            </FieldLabel>
            <FieldLabel>
              <span>Email</span>
              <TextInput type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="name@email.com" required />
            </FieldLabel>
            <FieldLabel>
              <span>Password</span>
              <TextInput type="text" value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="Temporary login password" required />
            </FieldLabel>
            <FieldLabel>
              <span>Phone</span>
              <TextInput value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="+60123456789" />
            </FieldLabel>
            <FieldLabel>
              <span>Status</span>
              <SelectInput value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="paused">Paused</option>
                <option value="suspended">Suspended</option>
              </SelectInput>
            </FieldLabel>
            <FieldLabel>
              <span>Date of Birth</span>
              <TextInput type="date" value={form.dob} onChange={(event) => updateField("dob", event.target.value)} />
            </FieldLabel>
            <FieldLabel>
              <span>Gender</span>
              <SelectInput value={form.gender} onChange={(event) => updateField("gender", event.target.value)}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </SelectInput>
            </FieldLabel>
            <FieldLabel>
              <span>City</span>
              <TextInput value={form.city} onChange={(event) => updateField("city", event.target.value)} placeholder="Kuala Lumpur" />
            </FieldLabel>
            <FieldLabel>
              <span>Region / State</span>
              <TextInput value={form.region} onChange={(event) => updateField("region", event.target.value)} placeholder="Kuala Lumpur" />
            </FieldLabel>
            <FieldLabel>
              <span>Country</span>
              <TextInput value={form.country} onChange={(event) => updateField("country", event.target.value)} placeholder="Malaysia" />
            </FieldLabel>
          </div>
        </section>

        {isProvider ? (
          <>
            <section className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(16,24,40,0.08)]">
              <h2 className="text-lg font-bold text-slate-950">Provider Profile</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <FieldLabel>
                  <span>Marketing Name</span>
                  <TextInput value={form.marketingName} onChange={(event) => updateField("marketingName", event.target.value)} placeholder="Display / business name" />
                </FieldLabel>
                <FieldLabel>
                  <span>Approval Status</span>
                  <SelectInput value={form.approvalStatus} onChange={(event) => updateField("approvalStatus", event.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="document_review">Document Review</option>
                    <option value="approved">Approved</option>
                  </SelectInput>
                </FieldLabel>
                <FieldLabel>
                  <span>Profile Image</span>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    {profilePhoto ? (
                      <img src={profilePhoto.dataUrl} alt={profilePhoto.fileName} className="h-36 w-full rounded-2xl object-cover" />
                    ) : (
                      <div className="grid h-36 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                        Upload and crop profile photo
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => profileInputRef.current?.click()} className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700">
                        {profilePhoto ? "Replace Image" : "Upload Image"}
                      </button>
                      {profilePhoto ? (
                        <button type="button" onClick={() => setProfilePhoto(null)} className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700">
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleProfileImageSelect(event)} />
                  </div>
                </FieldLabel>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <FieldLabel>
                  <span>Residential Address</span>
                  <TextArea rows={4} value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="Enter full address" />
                </FieldLabel>
                <FieldLabel>
                  <span>About</span>
                  <TextArea rows={4} value={form.bio} onChange={(event) => updateField("bio", event.target.value)} placeholder="Short provider bio" />
                </FieldLabel>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(16,24,40,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-950">Services</h2>
                <button type="button" onClick={addService} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  Add Another Service
                </button>
              </div>

              <div className="mt-5 space-y-5">
                {services.map((service, index) => (
                  <div key={service.id} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-base font-bold text-slate-900">Service {index + 1}</h3>
                      {services.length > 1 ? (
                        <button type="button" onClick={() => removeService(service.id)} className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700">
                          Remove Service
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <FieldLabel>
                        <span>Service Type</span>
                        <SelectInput
                          value={service.serviceType}
                          onChange={(event) => updateService(service.id, { serviceType: event.target.value })}
                        >
                          <option value="">Select service</option>
                          {providerServiceOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </SelectInput>
                      </FieldLabel>
                      {service.serviceType === "Other" ? (
                        <FieldLabel>
                          <span>Custom Service Type</span>
                          <TextInput
                            value={service.customServiceType}
                            onChange={(event) => updateService(service.id, { customServiceType: event.target.value })}
                            placeholder="Enter custom service"
                          />
                        </FieldLabel>
                      ) : null}
                      <FieldLabel>
                        <span>Service Location</span>
                        <TextInput
                          value={service.serviceLocation}
                          onChange={(event) => updateService(service.id, { serviceLocation: event.target.value })}
                          placeholder="Kuala Lumpur"
                        />
                      </FieldLabel>
                      <FieldLabel>
                        <span>Radius (km)</span>
                        <TextInput
                          type="number"
                          min="0"
                          step="1"
                          value={service.serviceRadiusKm}
                          onChange={(event) => updateService(service.id, { serviceRadiusKm: event.target.value })}
                          placeholder="15"
                        />
                      </FieldLabel>
                      <FieldLabel>
                        <span>Years Experience</span>
                        <TextInput
                          value={service.yearsExperience}
                          onChange={(event) => updateService(service.id, { yearsExperience: event.target.value })}
                          placeholder="3 years"
                        />
                      </FieldLabel>
                      <FieldLabel>
                        <span>Hourly Rate</span>
                        <TextInput
                          type="number"
                          min="0"
                          step="0.01"
                          value={service.hourlyRate}
                          onChange={(event) => updateService(service.id, { hourlyRate: event.target.value })}
                          placeholder="40"
                        />
                      </FieldLabel>
                      <FieldLabel>
                        <span>Daily Rate</span>
                        <TextInput
                          type="number"
                          min="0"
                          step="0.01"
                          value={service.dailyRate}
                          onChange={(event) => updateService(service.id, { dailyRate: event.target.value })}
                          placeholder="250"
                        />
                      </FieldLabel>
                    </div>

                    <div className="mt-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-700">Service Work Images</p>
                        <button
                          type="button"
                          onClick={() => serviceFileRefs.current[service.id]?.click()}
                          className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700"
                        >
                          Upload Work Images
                        </button>
                        <input
                          ref={(node) => {
                            serviceFileRefs.current[service.id] = node;
                          }}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(event) => void handleServiceImagesUpload(event, service.id)}
                        />
                      </div>

                      {service.workImages.length ? (
                        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {service.workImages.map((asset, assetIndex) => (
                            <UploadedAssetCard
                              key={`${service.id}-${asset.fileName}-${assetIndex}`}
                              asset={asset}
                              title={`Work Image ${assetIndex + 1}`}
                              onCaptionChange={(value) =>
                                updateService(service.id, {
                                  workImages: service.workImages.map((currentAsset, currentIndex) =>
                                    currentIndex === assetIndex ? { ...currentAsset, caption: value } : currentAsset,
                                  ),
                                })
                              }
                              onRemove={() =>
                                updateService(service.id, {
                                  workImages: service.workImages.filter((_, currentIndex) => currentIndex !== assetIndex),
                                })
                              }
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                          No service work images uploaded yet.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(16,24,40,0.08)]">
              <h2 className="text-lg font-bold text-slate-950">Documents & Verification</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <FieldLabel>
                  <span>Identity Document</span>
                  <SelectInput value={form.identityDocumentType} onChange={(event) => updateField("identityDocumentType", event.target.value)}>
                    {identityDocumentOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </SelectInput>
                </FieldLabel>
                <FieldLabel>
                  <span>Availability Preset</span>
                  <TextInput value={form.availabilityPreset} onChange={(event) => updateField("availabilityPreset", event.target.value)} placeholder="Weekdays / Full day / Custom time" />
                </FieldLabel>
                <FieldLabel>
                  <span>Visible in app/admin</span>
                  <div className="flex h-[50px] items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
                    <input type="checkbox" checked={form.visible} onChange={(event) => updateField("visible", event.target.checked)} className="size-4 rounded border-slate-300" />
                    <span className="ml-3 text-sm text-slate-700">Show this provider</span>
                  </div>
                </FieldLabel>
                <FieldLabel>
                  <span>Start Time</span>
                  <TextInput type="time" value={form.availabilityStartTime} onChange={(event) => updateField("availabilityStartTime", event.target.value)} />
                </FieldLabel>
                <FieldLabel>
                  <span>End Time</span>
                  <TextInput type="time" value={form.availabilityEndTime} onChange={(event) => updateField("availabilityEndTime", event.target.value)} />
                </FieldLabel>
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-700">Availability Days</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {availabilityDayOptions.map((day) => {
                    const active = availabilityDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleAvailabilityDay(day)}
                        className={`rounded-full px-3 py-2 text-xs font-semibold transition ${active ? "bg-emerald-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {([
                  ["emailVerified", "Email verified"],
                  ["phoneVerified", "Phone verified"],
                  ["identityVerified", "Identity verified"],
                  ["kycVerified", "KYC verified"],
                  ["backgroundCheckVerified", "Background check verified"],
                ] as Array<[string, string]>).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(form[key as keyof typeof form])}
                      onChange={(event) => updateField(key, event.target.checked)}
                      className="size-4 rounded border-slate-300"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-700">{form.identityDocumentType} Front</p>
                    <button type="button" onClick={() => identityFrontInputRef.current?.click()} className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700">
                      Upload
                    </button>
                    <input ref={identityFrontInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleSimpleImageUpload(event, { kind: "identityFront" })} />
                  </div>
                  <div className="mt-3">
                    {identityFront ? (
                      <UploadedAssetCard asset={identityFront} title={`${form.identityDocumentType} Front`} onRemove={() => setIdentityFront(null)} />
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                        No front document uploaded.
                      </div>
                    )}
                  </div>
                </div>

                {needsIdentityBack ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-700">{form.identityDocumentType} Back</p>
                      <button type="button" onClick={() => identityBackInputRef.current?.click()} className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700">
                        Upload
                      </button>
                      <input ref={identityBackInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleSimpleImageUpload(event, { kind: "identityBack" })} />
                    </div>
                    <div className="mt-3">
                      {identityBack ? (
                        <UploadedAssetCard asset={identityBack} title={`${form.identityDocumentType} Back`} onRemove={() => setIdentityBack(null)} />
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                          No back document uploaded.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          </>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" onClick={() => navigate(isProvider ? "/service-providers" : "/users")} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-2xl bg-[linear-gradient(135deg,#0f8b3d,#16a34a)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,139,61,0.28)] disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? "Saving..." : isProvider ? "Create Provider" : "Create User"}
          </button>
        </div>
      </form>

      {cropDraft ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
          <div className="w-full max-w-2xl rounded-[28px] border border-white/20 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-950">
                  {cropDraft.target.kind === "profile"
                    ? "Crop Profile Image"
                    : cropDraft.target.kind === "service"
                      ? "Crop Work Image"
                      : `Crop ${cropDraft.target.kind === "identityFront" ? `${form.identityDocumentType} Front` : `${form.identityDocumentType} Back`}`}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {cropDraft.aspectRatio === 1
                    ? "Square crop is locked to 1:1 for profile photos."
                    : cropDraft.aspectRatio === 2
                      ? "Work image crop is locked to 2:1."
                      : "Adjust each edge independently for document cropping."}
                </p>
              </div>
              <button type="button" onClick={() => setCropDraft(null)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                Close
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100 p-4">
              <div
                ref={cropPreviewRef}
                className="mx-auto aspect-square max-w-[420px] cursor-grab touch-none overflow-hidden rounded-[28px] border border-dashed border-slate-300 bg-white active:cursor-grabbing"
                style={{
                  aspectRatio: String(cropDraft.aspectRatio ?? getCropMetrics(cropDraft).aspectRatio),
                  maxHeight: "420px",
                }}
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerUp}
                onPointerCancel={handleCropPointerUp}
              >
                <img
                  src={cropDraft.imageSrc}
                  alt={cropDraft.fileName}
                  className="pointer-events-none select-none"
                  draggable={false}
                  style={getCropPreviewStyle(cropDraft, cropPreviewRef.current?.getBoundingClientRect().width ?? 420).style}
                />
              </div>
              <p className="mt-3 text-center text-xs font-medium text-slate-500">
                {cropDraft.aspectRatio
                  ? "Drag the image to reposition inside the locked crop."
                  : "Use the edge sliders below to trim the document exactly as needed."}
              </p>
            </div>

            {cropDraft.aspectRatio ? (
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <FieldLabel>
                  <span>Zoom</span>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={cropDraft.scale}
                    onChange={(event) => updateCropDraft({ scale: Number(event.target.value) })}
                    className="w-full"
                  />
                </FieldLabel>
                <FieldLabel>
                  <span>Left / Right</span>
                  <input
                    type="range"
                    min={cropBounds ? Math.floor(cropBounds.minOffsetX) : -120}
                    max={cropBounds ? Math.ceil(cropBounds.maxOffsetX) : 120}
                    step="1"
                    value={cropDraft.offsetX}
                    onChange={(event) => updateCropDraft({ offsetX: Number(event.target.value) })}
                    className="w-full"
                  />
                </FieldLabel>
                <FieldLabel>
                  <span>Up / Down</span>
                  <input
                    type="range"
                    min={cropBounds ? Math.floor(cropBounds.minOffsetY) : -120}
                    max={cropBounds ? Math.ceil(cropBounds.maxOffsetY) : 120}
                    step="1"
                    value={cropDraft.offsetY}
                    onChange={(event) => updateCropDraft({ offsetY: Number(event.target.value) })}
                    className="w-full"
                  />
                </FieldLabel>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <FieldLabel>
                  <span>Trim Left Edge</span>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, cropDraft.imageWidth - 80 - cropDraft.trimRight)}
                    step="1"
                    value={cropDraft.trimLeft}
                    onChange={(event) => updateCropDraft({ trimLeft: Number(event.target.value) })}
                    className="w-full"
                  />
                </FieldLabel>
                <FieldLabel>
                  <span>Trim Right Edge</span>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, cropDraft.imageWidth - 80 - cropDraft.trimLeft)}
                    step="1"
                    value={cropDraft.trimRight}
                    onChange={(event) => updateCropDraft({ trimRight: Number(event.target.value) })}
                    className="w-full"
                  />
                </FieldLabel>
                <FieldLabel>
                  <span>Trim Top Edge</span>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, cropDraft.imageHeight - 80 - cropDraft.trimBottom)}
                    step="1"
                    value={cropDraft.trimTop}
                    onChange={(event) => updateCropDraft({ trimTop: Number(event.target.value) })}
                    className="w-full"
                  />
                </FieldLabel>
                <FieldLabel>
                  <span>Trim Bottom Edge</span>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, cropDraft.imageHeight - 80 - cropDraft.trimTop)}
                    step="1"
                    value={cropDraft.trimBottom}
                    onChange={(event) => updateCropDraft({ trimBottom: Number(event.target.value) })}
                    className="w-full"
                  />
                </FieldLabel>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setCropDraft(null)} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
                Cancel
              </button>
              <button type="button" onClick={() => void applyProfileCrop()} className="rounded-2xl bg-[linear-gradient(135deg,#0f8b3d,#16a34a)] px-5 py-3 text-sm font-semibold text-white">
                Use Cropped Image
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
