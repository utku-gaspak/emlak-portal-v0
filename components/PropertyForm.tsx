"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Listing, ListingStatus, ListingType, Category } from "@/lib/types";
import { useTranslation } from "@/context/TranslationContext";
import { useToast } from "@/components/ToastProvider";
import { CategoryDropdown } from "@/components/CategoryDropdown";
import { StatusDropdown } from "@/components/StatusDropdown";
import { LocationPickerModal } from "@/components/LocationPickerModal";
import {
  determineListingTypeFromCategory,
  findCategoryById,
  getChildCategories,
  getPreferredParentCategoryId
} from "@/lib/category-utils";

type ListingField =
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

function buildFormState(initialData?: Listing, categories: Category[] = []): FormState {
  const initialCategory = initialData?.categoryId ? findCategoryById(categories, initialData.categoryId) : null;
  const preferredParentId = initialCategory ? initialCategory.parentId ?? initialCategory.id : getPreferredParentCategoryId(categories, initialData?.type ?? "house");

  return {
    isFeatured: initialData?.isFeatured ?? false,
    status: initialData?.status ?? "satilik",
    parentCategoryId: preferredParentId,
    categoryId: initialCategory?.parentId ? initialCategory.id : "",
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

function resetIncompatibleFields(current: FormState, nextType: ListingType): FormState {
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
    parcelNumber: ""
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
  const [addressQuery, setAddressQuery] = useState("");
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
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
      ...resetIncompatibleFields(current, nextType),
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
      ...resetIncompatibleFields(current, nextType),
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

    const formData = new FormData(event.currentTarget);
    formData.set("status", formState.status);
    formData.set("category_id", formState.categoryId);
    formData.set("currency", formState.currency);
    formData.set("latitude", formState.latitude);
    formData.set("longitude", formState.longitude);

    if (formState.isFeatured) {
      formData.set("isFeatured", "on");
    } else {
      formData.delete("isFeatured");
    }

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
      return;
    }

    if (mode === "create") {
      setFormState(buildFormState(undefined, categories));
      formRef.current?.reset();
      setAddressQuery("");
    }

    setIsSubmitting(false);
    setSuccess(true);
    showToast(successMessage, "success");
    router.push("/admin/listings");
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
        <div className="grid gap-4 md:grid-cols-3">
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

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
            <input
              id="prop-price"
              data-automation="price-input"
              name="price"
              type="number"
              min="1"
              className="input-base"
              required
              value={formState.price}
              onChange={(event) => updateField("price", event.target.value)}
              placeholder={t.admin.form.pricePlaceholder}
            />
            <select
              id="prop-currency"
              data-automation="currency-select"
              name="currency"
              value={formState.currency}
              onChange={(event) => updateField("currency", event.target.value)}
              className="input-base"
              aria-label={t.admin.form.currency}
            >
              <option value="TL">{t.admin.form.currencyTL}</option>
              <option value="USD">{t.admin.form.currencyUSD}</option>
              <option value="EUR">{t.admin.form.currencyEUR}</option>
            </select>
          </div>
          {renderError("price")}
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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {t.admin.form.manualLocationTitle}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {t.admin.form.addressSearchTitle}
            </p>
            <div className="mt-4 space-y-3">
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

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {t.admin.form.mapPickerTitle}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{t.admin.form.mapPickerDescription}</p>
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

            <div>
              <label htmlFor="prop-heating-type" className="label-base">
                {t.admin.form.heatingType}
              </label>
              <input
                id="prop-heating-type"
                data-automation="heating-input"
                name="heatingType"
                type="text"
                className="input-base"
                placeholder={t.admin.form.heatingPlaceholder}
                required
                value={formState.heatingType}
                onChange={(event) => updateField("heatingType", event.target.value)}
              />
              {renderError("heatingType")}
            </div>
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
              <label htmlFor="prop-zoning-status" className="label-base">
                {t.admin.form.zoningStatus}
              </label>
              <input
                id="prop-zoning-status"
                data-automation="zoning-input"
                name="zoningStatus"
                type="text"
                className="input-base"
                placeholder={t.admin.form.zoningPlaceholder}
                required
                value={formState.zoningStatus}
                onChange={(event) => updateField("zoningStatus", event.target.value)}
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
          id="prop-photos"
          data-automation="photos-input"
          name="photos"
          type="file"
          multiple
          accept="image/*"
          className="input-base"
          required={mode === "create" || !hasExistingPhotos}
        />
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
        disabled={isSubmitting}
      >
        {isSubmitting ? t.admin.form.saving : submitLabel}
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

