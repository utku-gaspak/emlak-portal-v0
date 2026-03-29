"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { Listing, ListingStatus, ListingType, Category } from "@/lib/types";
import { useTranslation } from "@/context/TranslationContext";
import { useToast } from "@/components/ToastProvider";
import { CategoryDropdown } from "@/components/CategoryDropdown";
import { StatusDropdown } from "@/components/StatusDropdown";
import { LocationPickerModal } from "@/components/LocationPickerModal";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { ChevronDown } from "lucide-react";
import {
  determineListingTypeFromCategory,
  findCategoryById,
  getChildCategories,
  getPreferredParentCategoryId,
  shouldShowHeatingType
} from "@/lib/category-utils";

type ListingField =
  | "listingNo"
  | "status"
  | "categoryId"
  | "type"
  | "currency"
  | "title"
  | "price"
  | "location"
  | "areaSqm"
  | "latitude"
  | "longitude"
  | "roomCount"
  | "floorNumber"
  | "heatingType"
  | "zoningStatus"
  | "islandNumber"
  | "parcelNumber"
  | "description"
  | "photos";

type ListingErrors = Partial<Record<ListingField, string>>;

type PropertyFormProps = {
  mode: "create" | "edit";
  initialData?: Listing;
  categories?: Category[];
};

type FormState = {
  isFeatured: boolean;
  status: ListingStatus;
  parentCategoryId: string;
  categoryId: string;
  listingNo: string;
  currency: "TL" | "USD" | "EUR";
  title: string;
  price: string;
  location: string;
  areaSqm: string;
  latitude: string;
  longitude: string;
  roomCount: string;
  floorNumber: string;
  heatingType: string;
  zoningStatus: string;
  islandNumber: string;
  parcelNumber: string;
  description: string;
};

type TextFormField = Exclude<keyof FormState, "isFeatured">;

const errorIdByField: Record<ListingField, string> = {
  listingNo: "error-listing-no",
  status: "error-status",
  categoryId: "error-category-id",
  type: "error-type",
  currency: "error-currency",
  title: "error-title",
  price: "error-price",
  location: "error-location",
  areaSqm: "error-area-sqm",
  latitude: "error-latitude",
  longitude: "error-longitude",
  roomCount: "error-room-count",
  floorNumber: "error-floor-number",
  heatingType: "error-heating-type",
  zoningStatus: "error-zoning-status",
  islandNumber: "error-island-number",
  parcelNumber: "error-parcel-number",
  description: "error-description",
  photos: "error-photos"
};

const ISTANBUL_COORDINATES = {
  latitude: 41.0082,
  longitude: 28.9784
};

const HEATING_TYPE_OPTIONS = [
  { value: "Doğalgaz (Kombi)", labelTr: "Doğalgaz (Kombi)", labelEn: "Natural Gas (Combi)" },
  { value: "Merkezi Sistem", labelTr: "Merkezi Sistem", labelEn: "Central System" },
  { value: "Yerden Isıtma", labelTr: "Yerden Isıtma", labelEn: "Underfloor Heating" },
  { value: "Klima", labelTr: "Klima", labelEn: "Air Conditioning" },
  { value: "Soba / Katı Yakıt", labelTr: "Soba / Katı Yakıt", labelEn: "Stove / Solid Fuel" },
  { value: "Isı Pompası", labelTr: "Isı Pompası", labelEn: "Heat Pump" },
  { value: "Yok", labelTr: "Yok", labelEn: "None" }
] as const;

const CURRENCY_OPTIONS = [
  { value: "TL", labelTr: "₺ TL", labelEn: "₺ TL" },
  { value: "USD", labelTr: "$ USD", labelEn: "$ USD" },
  { value: "EUR", labelTr: "€ EUR", labelEn: "€ EUR" }
] as const;

const ZONING_STATUS_OPTIONS = [
  { value: "İmarlı", labelTr: "İmarlı", labelEn: "İmarlı" },
  { value: "İmarsız", labelTr: "İmarsız", labelEn: "İmarsız" }
] as const;

function buildFormState(initialData?: Listing, categories: Category[] = []): FormState {
  const initialCategory = initialData?.categoryId ? findCategoryById(categories, initialData.categoryId) : null;
  const preferredParentId = initialCategory ? initialCategory.parentId ?? initialCategory.id : getPreferredParentCategoryId(categories, initialData?.type ?? "house");

  return {
    isFeatured: initialData?.isFeatured ?? false,
    status: initialData?.status ?? "satilik",
    parentCategoryId: preferredParentId,
    categoryId: initialCategory?.parentId ? initialCategory.id : "",
    listingNo: String(initialData?.listingNo ?? ""),
    currency: initialData?.currency ?? "TL",
    title: initialData?.title ?? "",
    price: initialData ? String(initialData.price) : "",
    location: initialData?.location ?? "",
    areaSqm: initialData ? String(initialData.areaSqm) : "",
    latitude: initialData?.latitude != null ? String(initialData.latitude) : "",
    longitude: initialData?.longitude != null ? String(initialData.longitude) : "",
    roomCount: initialData?.type === "house" ? initialData.roomCount : "",
    floorNumber: initialData?.type === "house" ? initialData.floorNumber : "",
    heatingType: initialData?.type === "house" ? initialData.heatingType : "",
    zoningStatus: initialData?.type === "land" ? initialData.zoningStatus : "",
    islandNumber: initialData?.type === "land" ? initialData.islandNumber : "",
    parcelNumber: initialData?.type === "land" ? initialData.parcelNumber : "",
    description: initialData?.description ?? ""
  };
}

function resetIncompatibleFields(current: FormState, nextType: ListingType, showHeatingTypeField: boolean): FormState {
  if (nextType === "land") {
    return {
      ...current,
      roomCount: "",
      floorNumber: "",
      heatingType: ""
    };
  }

  return {
    ...current,
    zoningStatus: "",
    islandNumber: "",
    parcelNumber: "",
    heatingType: showHeatingTypeField ? current.heatingType : ""
  };
}

export function PropertyForm({ mode, initialData, categories = [] }: PropertyFormProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(() => buildFormState(initialData, categories));
  const [errors, setErrors] = useState<ListingErrors>({});
  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [addressQuery, setAddressQuery] = useState("");
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [openLocationMethod, setOpenLocationMethod] = useState<"manual" | "address" | "map" | "">("");
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [uploadSessionId] = useState(() => initialData?.id ?? crypto.randomUUID());
  const formRef = useRef<HTMLFormElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const categoriesById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const parentCategories = useMemo(() => categories.filter((category) => !category.parentId), [categories]);
  const selectedParentCategory = formState.parentCategoryId ? categoriesById.get(formState.parentCategoryId) ?? null : null;
  const subCategories = useMemo(
    () => (formState.parentCategoryId ? getChildCategories(categories, formState.parentCategoryId) : []),
    [categories, formState.parentCategoryId]
  );
  const selectedCategory = formState.categoryId ? categoriesById.get(formState.categoryId) ?? null : null;
  const listingType = useMemo(
    () => determineListingTypeFromCategory(selectedCategory, selectedParentCategory),
    [selectedCategory, selectedParentCategory]
  );
  const showHeatingType = shouldShowHeatingType(selectedCategory, selectedParentCategory);

  const actionPath = useMemo(() => {
    if (mode === "edit" && initialData) {
      return `/api/admin/listings/${initialData.id}`;
    }

    return "/api/admin/listings";
  }, [initialData, mode]);

  const hasExistingPhotos = (initialData?.images.length ?? 0) > 0;
  const isHouse = listingType === "house";
  const submitLabel = mode === "edit" ? t.admin.form.updateButton : t.admin.form.submitButton;
  const successMessage = mode === "edit" ? t.admin.form.updateSuccessMessage : t.admin.form.successMessage;
  const photosLabel = mode === "edit" && hasExistingPhotos ? t.admin.form.addMorePhotosLabel : t.admin.form.photos;
  const latitudeValue = formState.latitude.trim() ? Number(formState.latitude) : null;
  const longitudeValue = formState.longitude.trim() ? Number(formState.longitude) : null;
  const hasManualCoordinates =
    typeof latitudeValue === "number" && Number.isFinite(latitudeValue) && typeof longitudeValue === "number" && Number.isFinite(longitudeValue);
  const isEnglish = t.meta.lang === "en";

  function toggleLocationMethod(method: "manual" | "address" | "map") {
    setOpenLocationMethod((current) => (current === method ? "" : method));
  }

  function updateField(field: TextFormField, value: string) {
    setSuccess(false);
    setFormState((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateCheckbox(field: "isFeatured", value: boolean) {
    setSuccess(false);
    setFormState((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateStatus(value: ListingStatus) {
    setSuccess(false);
    setFormState((current) => ({
      ...current,
      status: value
    }));
  }

  function updateCoordinates(latitude: number | null, longitude: number | null) {
    setSuccess(false);
    setFormState((current) => ({
      ...current,
      latitude: typeof latitude === "number" && Number.isFinite(latitude) ? String(latitude) : "",
      longitude: typeof longitude === "number" && Number.isFinite(longitude) ? String(longitude) : ""
    }));
  }

  function handlePhotoSelection(event: ChangeEvent<HTMLInputElement>) {
    setSuccess(false);
    const files = Array.from(event.target.files ?? []).filter((file) => file.size > 0);
    setSelectedPhotos(files);
  }

  function getFileExtension(file: File) {
    const fileNameExtension = file.name.split(".").pop()?.trim().toLowerCase();
    if (fileNameExtension) {
      return fileNameExtension.replace(/[^a-z0-9]/gi, "");
    }

    const mimeExtension = file.type.split("/").pop()?.trim().toLowerCase();
    if (mimeExtension) {
      return mimeExtension.replace(/[^a-z0-9]/gi, "");
    }

    return "jpg";
  }

  function getExtensionFromMime(mimeType: string) {
    const extension = mimeType.split("/").pop()?.trim().toLowerCase();
    if (!extension) {
      return "jpg";
    }

    return extension.replace(/[^a-z0-9]/gi, "") || "jpg";
  }

  function toUploadFile(input: File | Blob, originalName: string) {
    const resolvedType = input.type || "image/jpeg";
    const extension = getExtensionFromMime(resolvedType);
    const baseName = originalName.replace(/\.[^.]+$/, "") || "photo";

    return new File([input], `${baseName}.${extension}`, {
      type: resolvedType,
      lastModified: Date.now()
    });
  }

  function buildStoragePath(file: File, index: number) {
    const extension = getFileExtension(file) || "jpg";
    return `${uploadSessionId}/${String(index + 1).padStart(3, "0")}-${Date.now()}.${extension}`;
  }

  async function compressAndUploadPhotos() {
    if (selectedPhotos.length === 0) {
      return [] as string[];
    }

    const uploadedUrls: string[] = [];
    setUploadProgress(0);

    for (let index = 0; index < selectedPhotos.length; index += 1) {
      const originalFile = selectedPhotos[index];
      setIsCompressing(true);
      setIsUploadingPhotos(false);

      const compressed = await imageCompression(
        originalFile,
        {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          onProgress: (progress: number) => {
            const normalized = Math.max(0, Math.min(100, progress));
            const stepProgress = ((index + normalized / 100) / selectedPhotos.length) * 100;
            setUploadProgress(Math.max(0, Math.min(100, stepProgress)));
          }
        } as any
      );

      setIsCompressing(false);
      setIsUploadingPhotos(true);

      const uploadFile = toUploadFile(compressed, originalFile.name);
      const storagePath = buildStoragePath(uploadFile, index);
      const { error: uploadError } = await supabaseBrowser.storage.from("listings").upload(storagePath, uploadFile, {
        contentType: uploadFile.type || originalFile.type || "image/jpeg",
        upsert: true
      });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabaseBrowser.storage.from("listings").getPublicUrl(storagePath);
      uploadedUrls.push(data.publicUrl);
      setUploadProgress(((index + 1) / selectedPhotos.length) * 100);
    }

    setIsUploadingPhotos(false);
    setIsCompressing(false);
    return uploadedUrls;
  }

  async function handleAddressSearch() {
    const query = addressQuery.trim();

    if (!query) {
      showToast(t.admin.form.addressSearchNotFound, "error");
      return;
    }

    try {
      setIsSearchingAddress(true);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Geocoding request failed.");
      }

      const results = (await response.json()) as Array<{ lat: string; lon: string; display_name?: string }>;

      if (!results.length) {
        showToast(t.admin.form.addressSearchNotFound, "error");
        return;
      }

      const nextLatitude = Number(results[0].lat);
      const nextLongitude = Number(results[0].lon);

      if (!Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude)) {
        showToast(t.admin.form.addressSearchError, "error");
        return;
      }

      updateCoordinates(nextLatitude, nextLongitude);

      if (!formState.location.trim() && results[0].display_name) {
        updateField("location", results[0].display_name);
      }

      showToast(t.admin.form.addressSearchSuccess, "success");
    } catch {
      showToast(t.admin.form.addressSearchError, "error");
    } finally {
      setIsSearchingAddress(false);
    }
  }

  function handleParentCategoryChange(parentCategoryId: string) {
    setSuccess(false);
    setErrors({});
    setGlobalError("");

    const nextParent = parentCategoryId ? categoriesById.get(parentCategoryId) ?? null : null;
    const nextType = determineListingTypeFromCategory(nextParent, null);

    setFormState((current) => ({
      ...resetIncompatibleFields(current, nextType, shouldShowHeatingType(nextParent, null)),
      parentCategoryId,
      categoryId: ""
    }));
  }

  function handleSubCategoryChange(categoryId: string) {
    setSuccess(false);
    setErrors({});
    setGlobalError("");

    const nextCategory = categoryId ? categoriesById.get(categoryId) ?? null : null;
    const nextParentId = nextCategory?.parentId ?? formState.parentCategoryId;
    const nextParent = nextParentId ? categoriesById.get(nextParentId) ?? null : null;
    const nextType = determineListingTypeFromCategory(nextCategory, nextParent);

    setFormState((current) => ({
      ...resetIncompatibleFields(current, nextType, shouldShowHeatingType(nextCategory, nextParent)),
      parentCategoryId: nextParentId ?? "",
      categoryId
    }));
  }

  const renderError = (field: ListingField) => {
    if (!errors[field]) {
      return null;
    }

    return (
      <div
        id={errorIdByField[field]}
        data-automation={errorIdByField[field]}
        className="mt-1 text-sm text-red-600 dark:text-red-400"
      >
        {errors[field]}
      </div>
    );
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuccess(false);
    setErrors({});
    setGlobalError("");
    setIsSubmitting(true);
    setUploadProgress(0);

    const formData = new FormData(event.currentTarget);
    formData.set("status", formState.status);
    formData.set("category_id", formState.categoryId);
    formData.set("listing_no", formState.listingNo.trim());
    formData.set("currency", formState.currency);
    formData.set("latitude", formState.latitude);
    formData.set("longitude", formState.longitude);
    formData.set("heatingType", isHouse && showHeatingType ? formState.heatingType.trim() : "");
    console.log("Form submit values:", {
      ...Object.fromEntries(formData.entries()),
      heatingType: isHouse && showHeatingType ? formState.heatingType.trim() : ""
    });

    if (formState.isFeatured) {
      formData.set("isFeatured", "on");
    } else {
      formData.delete("isFeatured");
    }

    try {
      const uploadedImageUrls = await compressAndUploadPhotos();
      uploadedImageUrls.forEach((url) => formData.append("imageUrls", url));

      const response = await fetch(actionPath, {
        method: mode === "edit" ? "PUT" : "POST",
        body: formData
      });

      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : { ok: false, error: await response.text() };

      if (!response.ok) {
        const responseErrors = payload?.errors ?? {};
        setErrors(responseErrors);
        if (responseErrors.auth) {
          setGlobalError(String(responseErrors.auth));
          showToast(String(responseErrors.auth), "error");
        } else {
          const message = payload?.error || Object.values(responseErrors)[0] || t.errors.invalidRequestBody;
          setGlobalError(String(message));
          showToast(String(message), "error");
        }
        setIsSubmitting(false);
        setIsCompressing(false);
        setIsUploadingPhotos(false);
        return;
      }

      if (mode === "create") {
        setFormState(buildFormState(undefined, categories));
        formRef.current?.reset();
        setAddressQuery("");
        setSelectedPhotos([]);
        if (photoInputRef.current) {
          photoInputRef.current.value = "";
        }
      }

      setIsSubmitting(false);
      setUploadProgress(100);
      setSuccess(true);
      showToast(successMessage, "success");
      router.push("/admin/listings");
    } catch (error) {
      const message = error instanceof Error ? error.message : t.errors.invalidRequestBody;
      setGlobalError(message);
      showToast(message, "error");
      setIsSubmitting(false);
      setIsCompressing(false);
      setIsUploadingPhotos(false);
    }
  }

  return (
    <form
      ref={formRef}
      id={mode === "edit" ? "edit-listing-form" : "add-listing-form"}
      data-automation={mode === "edit" ? "edit-listing-form" : "add-listing-form"}
      className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-[0_20px_60px_rgba(2,6,23,0.35)]"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="type" value={listingType} />
      <input type="hidden" name="status" value={formState.status} />
      <input type="hidden" name="category_id" value={formState.categoryId} />

      <div className="rounded-3xl bg-slate-50 p-4 sm:p-5 dark:bg-slate-950/50">
        <div className="grid gap-4 md:grid-cols-[1fr_1.4fr_1fr_132px]">
          <div>
            <label htmlFor="prop-listing-no" className="label-base">
              {t.admin.form.listingNo}
            </label>
              <input
                id="prop-listing-no"
                data-automation="listing-no-input"
                name="listing_no"
                type="text"
                className="input-base"
                required
                value={formState.listingNo ?? ""}
                onChange={(event) => updateField("listingNo", event.target.value)}
                placeholder={t.admin.form.listingNoPlaceholder}
              />
            {renderError("listingNo")}
          </div>

          <StatusDropdown
            id="prop-status"
            label={t.admin.form.statusLabel}
            placeholder={t.admin.form.statusAll}
            value={formState.status}
            options={[
              { value: "satilik", label: t.admin.form.statusForSale },
              { value: "kiralik", label: t.admin.form.statusForRent }
            ]}
            onChange={(nextValue) => updateStatus(nextValue as ListingStatus)}
            dataAutomation="status-selector"
            clearLabel={t.common.clear}
          />

          <CategoryDropdown
            id="prop-parent-category"
            label={t.admin.form.parentCategoryLabel}
            placeholder={t.admin.form.parentCategoryPlaceholder}
            value={formState.parentCategoryId}
            options={parentCategories}
            onChange={handleParentCategoryChange}
            dataAutomation="parent-category-filter"
            clearLabel={t.common.clear}
            allowClear
          />

          <CategoryDropdown
            id="prop-sub-category"
            label={t.admin.form.subCategoryLabel}
            placeholder={t.admin.form.subCategoryPlaceholder}
            value={formState.categoryId}
            options={subCategories}
            onChange={handleSubCategoryChange}
            dataAutomation="subcategory-filter"
            clearLabel={t.common.clear}
            allowClear
            disabled={!formState.parentCategoryId}
          />
        </div>
        {renderError("categoryId")}
      </div>

      <div className="rounded-3xl border border-amber-200/70 bg-amber-50/60 p-4 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <label htmlFor="prop-featured" className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t.admin.form.featured}
            </label>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t.admin.form.featuredDescription}</p>
          </div>

          <input
            id="prop-featured"
            data-automation="featured-checkbox"
            name="isFeatured"
            type="checkbox"
            checked={formState.isFeatured}
            onChange={(event) => updateCheckbox("isFeatured", event.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.4fr_1fr_132px]">
        <div>
          <label htmlFor="prop-title" className="label-base">
            {t.admin.form.title}
          </label>
          <input
            id="prop-title"
            data-automation="title-input"
            name="title"
            type="text"
            className="input-base"
            required
            value={formState.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder={t.admin.form.titlePlaceholder}
          />
          {renderError("title")}
        </div>

        <div>
          <label htmlFor="prop-price" className="label-base">
            {t.admin.form.price}
          </label>
          <input
            id="prop-price"
            data-automation="price-input"
            name="price"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            value={formState.price}
            onChange={(event) => updateField("price", event.target.value)}
            placeholder={t.admin.form.pricePlaceholder}
            className="input-base h-11"
          />
          {renderError("price")}
        </div>

        <div>
          <StatusDropdown
            id="prop-currency"
            label={t.admin.form.currency}
            placeholder={t.admin.form.currency}
            value={formState.currency}
            options={CURRENCY_OPTIONS.map((option) => ({
              value: option.value,
              label: isEnglish ? option.labelEn : option.labelTr
            }))}
            onChange={(nextValue) => updateField("currency", nextValue)}
            dataAutomation="currency-select"
            className="input-base h-11"
          />
          {renderError("currency")}
        </div>

        <div>
          <label htmlFor="prop-location" className="label-base">
            {t.admin.form.location}
          </label>
          <input
            id="prop-location"
            data-automation="location-input"
            name="location"
            type="text"
            className="input-base"
            required
            value={formState.location}
            onChange={(event) => updateField("location", event.target.value)}
            placeholder={t.admin.form.locationPlaceholder}
          />
          {renderError("location")}
        </div>

        <div>
          <label htmlFor="prop-area-sqm" className="label-base">
            {t.admin.form.areaSqm}
          </label>
          <input
            id="prop-area-sqm"
            data-automation="area-input"
            name="areaSqm"
            type="number"
            min="1"
            className="input-base"
            required
            value={formState.areaSqm}
            onChange={(event) => updateField("areaSqm", event.target.value)}
            placeholder={t.admin.form.areaPlaceholder}
          />
          {renderError("areaSqm")}
        </div>
      </div>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950/50">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-amber-400">
            {t.admin.form.locationSectionTitle}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t.admin.form.locationSectionDescription}</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-3xl border border-sky-200/80 bg-sky-50/70 p-4 shadow-sm dark:border-sky-500/20 dark:bg-sky-500/10">
            <button
              type="button"
              onClick={() => toggleLocationMethod("manual")}
              className="flex w-full items-center justify-between gap-3 text-left"
              aria-expanded={openLocationMethod === "manual"}
            >
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
                {t.admin.form.manualLocationTitle}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-sky-500 transition ${openLocationMethod === "manual" ? "rotate-180" : ""}`} />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                openLocationMethod === "manual" ? "mt-4 max-h-[240px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="prop-latitude" className="label-base">
                    {t.admin.form.latitude}
                  </label>
                  <input
                    id="prop-latitude"
                    data-automation="latitude-input"
                    name="latitude"
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    className="input-base"
                    value={formState.latitude}
                    onChange={(event) => updateField("latitude", event.target.value)}
                    placeholder={t.admin.form.latitudePlaceholder}
                  />
                  {renderError("latitude")}
                </div>

                <div>
                  <label htmlFor="prop-longitude" className="label-base">
                    {t.admin.form.longitude}
                  </label>
                  <input
                    id="prop-longitude"
                    data-automation="longitude-input"
                    name="longitude"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    className="input-base"
                    value={formState.longitude}
                    onChange={(event) => updateField("longitude", event.target.value)}
                    placeholder={t.admin.form.longitudePlaceholder}
                  />
                  {renderError("longitude")}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/70 p-4 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <button
              type="button"
              onClick={() => toggleLocationMethod("address")}
              className="flex w-full items-center justify-between gap-3 text-left"
              aria-expanded={openLocationMethod === "address"}
            >
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                {t.admin.form.addressSearchTitle}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-emerald-500 transition ${openLocationMethod === "address" ? "rotate-180" : ""}`} />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                openLocationMethod === "address" ? "mt-4 max-h-[240px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="space-y-3">
                <div>
                  <label htmlFor="prop-address-search" className="label-base">
                    {t.admin.form.addressSearchLabel}
                  </label>
                  <input
                    id="prop-address-search"
                    data-automation="address-search-input"
                    type="text"
                    className="input-base"
                    value={addressQuery}
                    onChange={(event) => setAddressQuery(event.target.value)}
                    placeholder={t.admin.form.addressSearchPlaceholder}
                  />
                </div>

                <button
                  id="prop-address-search-button"
                  data-automation="address-search-button"
                  type="button"
                  onClick={handleAddressSearch}
                  disabled={isSearchingAddress}
                  className="button-primary w-full"
                >
                  {isSearchingAddress ? t.admin.form.saving : t.admin.form.searchCoordinatesButton}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-amber-200/80 bg-amber-50/70 p-4 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10">
            <button
              type="button"
              onClick={() => toggleLocationMethod("map")}
              className="flex w-full items-center justify-between gap-3 text-left"
              aria-expanded={openLocationMethod === "map"}
            >
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                {t.admin.form.mapPickerTitle}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-amber-500 transition ${openLocationMethod === "map" ? "rotate-180" : ""}`} />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                openLocationMethod === "map" ? "mt-4 max-h-[320px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{t.admin.form.mapPickerDescription}</p>
              <div className="mt-4 space-y-3">
                <button
                  id="prop-open-map-picker"
                  data-automation="open-map-picker-button"
                  type="button"
                  onClick={() => setIsMapPickerOpen(true)}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-200 dark:hover:border-amber-500/40 dark:hover:text-amber-400"
                >
                  {t.admin.form.mapPickerButton}
                </button>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-400">
                  {hasManualCoordinates
                    ? `${t.propertyDetail.coordinatesLabel}: ${formState.latitude}, ${formState.longitude}`
                    : t.admin.form.locationSectionDescription}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isHouse ? (
        <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-950/50">
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-amber-400">{t.admin.form.houseSectionTitle}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.admin.form.houseSectionDescription}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label htmlFor="prop-room-count" className="label-base">
                {t.admin.form.roomCount}
              </label>
              <input
                id="prop-room-count"
                data-automation="room-count-input"
                name="roomCount"
                type="text"
                className="input-base"
                placeholder={t.admin.form.roomCountPlaceholder}
                required
                value={formState.roomCount}
                onChange={(event) => updateField("roomCount", event.target.value)}
              />
              {renderError("roomCount")}
            </div>

            <div>
              <label htmlFor="prop-floor-number" className="label-base">
                {t.admin.form.floorNumber}
              </label>
              <input
                id="prop-floor-number"
                data-automation="floor-input"
                name="floorNumber"
                type="number"
                className="input-base"
                placeholder={t.admin.form.floorPlaceholder}
                required
                value={formState.floorNumber}
                onChange={(event) => updateField("floorNumber", event.target.value)}
              />
              {renderError("floorNumber")}
            </div>

            {showHeatingType ? (
              <div>
                <StatusDropdown
                  id="prop-heating-type"
                  label={t.admin.form.heatingType}
                  placeholder={t.admin.form.heatingPlaceholder}
                  value={formState.heatingType}
                  options={HEATING_TYPE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: isEnglish ? option.labelEn : option.labelTr
                  }))}
                  onChange={(nextValue) => updateField("heatingType", nextValue)}
                  dataAutomation="heating-input"
                  clearLabel={t.common.clear}
                  allowClear
                  className="input-base"
                />
                {renderError("heatingType")}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-950/50">
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-amber-400">{t.admin.form.landSectionTitle}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.admin.form.landSectionDescription}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <StatusDropdown
                  id="prop-zoning-status"
                  label={t.admin.form.zoningStatus}
                  placeholder={t.admin.form.zoningPlaceholder}
                  value={formState.zoningStatus}
                  options={ZONING_STATUS_OPTIONS.map((option) => ({
                    value: option.value,
                    label: isEnglish ? option.labelEn : option.labelTr
                  }))}
                  onChange={(nextValue) => updateField("zoningStatus", nextValue)}
                  dataAutomation="zoning-input"
                  clearLabel={t.common.clear}
                  allowClear
                  className="input-base"
                />
                {renderError("zoningStatus")}
              </div>

            <div>
              <label htmlFor="prop-island-number" className="label-base">
                {t.admin.form.islandNumber}
              </label>
              <input
                id="prop-island-number"
                data-automation="island-input"
                name="islandNumber"
                type="number"
                className="input-base"
                placeholder={t.admin.form.islandPlaceholder}
                required
                value={formState.islandNumber}
                onChange={(event) => updateField("islandNumber", event.target.value)}
              />
              {renderError("islandNumber")}
            </div>

            <div>
              <label htmlFor="prop-parcel-number" className="label-base">
                {t.admin.form.parcelNumber}
              </label>
              <input
                id="prop-parcel-number"
                data-automation="parcel-input"
                name="parcelNumber"
                type="number"
                className="input-base"
                placeholder={t.admin.form.parcelPlaceholder}
                required
                value={formState.parcelNumber}
                onChange={(event) => updateField("parcelNumber", event.target.value)}
              />
              {renderError("parcelNumber")}
            </div>
          </div>
        </div>
      )}

      {mode === "edit" && initialData?.images.length ? (
        <div className="sr-only" aria-hidden="true">
          {initialData.images.map((image) => (
            <input key={image} type="hidden" name="existingImages" value={image} />
          ))}
        </div>
      ) : null}

      <div>
        <label htmlFor="prop-photos" className="label-base">
          {photosLabel}
        </label>
        <input
          ref={photoInputRef}
          id="prop-photos"
          data-automation="photos-input"
          type="file"
          multiple
          accept="image/*"
          className="input-base"
          onChange={handlePhotoSelection}
          required={mode === "create" || !hasExistingPhotos}
        />
        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>
            {selectedPhotos.length > 0
              ? `${selectedPhotos.length} ${selectedPhotos.length === 1 ? t.gallery.imageLabel : t.admin.form.photos}`
              : mode === "edit" && hasExistingPhotos
                ? `${initialData?.images.length ?? 0} ${t.admin.form.photos}`
                : t.admin.form.photos}
          </span>
          {isCompressing || isUploadingPhotos ? (
            <span className="font-medium text-brand-700 dark:text-amber-400">
              {isCompressing ? "Sıkıştırılıyor..." : "Yükleniyor..."}
            </span>
          ) : null}
        </div>
        {isCompressing || isUploadingPhotos ? (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-brand-600 transition-all duration-300"
              style={{ width: `${Math.max(4, uploadProgress)}%` }}
            />
          </div>
        ) : null}
        {renderError("photos")}
      </div>

      <div>
        <label htmlFor="prop-description" className="label-base">
          {t.admin.form.description}
        </label>
        <textarea
          id="prop-description"
          data-automation="description-input"
          name="description"
          rows={5}
          className="input-base"
          required
          value={formState.description}
          onChange={(event) => updateField("description", event.target.value)}
          placeholder={t.admin.form.descriptionPlaceholder}
        />
        {renderError("description")}
      </div>

      <button
        id="submit-listing-button"
        data-automation="submit-listing-button"
        type="submit"
        className="button-primary"
        disabled={isSubmitting || isCompressing || isUploadingPhotos}
      >
        {isCompressing ? "Sıkıştırılıyor..." : isUploadingPhotos ? "Yükleniyor..." : isSubmitting ? t.admin.form.saving : submitLabel}
      </button>

      {success ? (
        <div
          id="success-indicator"
          data-automation="success-indicator"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          {successMessage}
        </div>
      ) : null}

      {globalError ? (
        <div id="error-auth" data-automation="error-auth" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {globalError}
        </div>
      ) : null}

      <LocationPickerModal
        open={isMapPickerOpen}
        title={formState.location.trim() || t.admin.form.mapPickerTitle}
        latitude={latitudeValue}
        longitude={longitudeValue}
        onClose={() => setIsMapPickerOpen(false)}
        onChange={(nextLatitude, nextLongitude) => updateCoordinates(nextLatitude, nextLongitude)}
      />
    </form>
  );
}








