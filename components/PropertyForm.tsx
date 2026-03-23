"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Listing, ListingType } from "@/lib/types";
import { useTranslation } from "@/context/TranslationContext";

type ListingField =
  | "type"
  | "currency"
  | "title"
  | "price"
  | "location"
  | "areaSqm"
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
};

type FormState = {
  isFeatured: boolean;
  currency: "TL" | "USD" | "EUR";
  title: string;
  price: string;
  location: string;
  areaSqm: string;
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
  type: "error-type",
  currency: "error-currency",
  title: "error-title",
  price: "error-price",
  location: "error-location",
  areaSqm: "error-area-sqm",
  roomCount: "error-room-count",
  floorNumber: "error-floor-number",
  heatingType: "error-heating-type",
  zoningStatus: "error-zoning-status",
  islandNumber: "error-island-number",
  parcelNumber: "error-parcel-number",
  description: "error-description",
  photos: "error-photos"
};

function buildFormState(initialData?: Listing): FormState {
  return {
    isFeatured: initialData?.isFeatured ?? false,
    currency: initialData?.currency ?? "TL",
    title: initialData?.title ?? "",
    price: initialData ? String(initialData.price) : "",
    location: initialData?.location ?? "",
    areaSqm: initialData ? String(initialData.areaSqm) : "",
    roomCount: initialData?.type === "house" ? initialData.roomCount : "",
    floorNumber: initialData?.type === "house" ? initialData.floorNumber : "",
    heatingType: initialData?.type === "house" ? initialData.heatingType : "",
    zoningStatus: initialData?.type === "land" ? initialData.zoningStatus : "",
    islandNumber: initialData?.type === "land" ? initialData.islandNumber : "",
    parcelNumber: initialData?.type === "land" ? initialData.parcelNumber : "",
    description: initialData?.description ?? ""
  };
}

export function PropertyForm({ mode, initialData }: PropertyFormProps) {
  const { t } = useTranslation();
  const initialType = initialData?.type ?? "house";
  const [listingType, setListingType] = useState<ListingType>(initialType);
  const [formState, setFormState] = useState<FormState>(() => buildFormState(initialData));
  const [errors, setErrors] = useState<ListingErrors>({});
  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const actionPath = useMemo(() => {
    if (mode === "edit" && initialData) {
      return `/api/admin/edit-listing/${initialData.id}`;
    }

    return "/api/admin/add-listing";
  }, [initialData, mode]);

  const hasExistingPhotos = (initialData?.images.length ?? 0) > 0;
  const isHouse = listingType === "house";
  const submitLabel = mode === "edit" ? t.listingForm.updateButton : t.listingForm.submitButton;
  const successMessage = mode === "edit" ? t.listingForm.updateSuccessMessage : t.listingForm.successMessage;
  const photosLabel = mode === "edit" && hasExistingPhotos ? t.listingForm.addMorePhotosLabel : t.listingForm.photosLabel;

  const updateField = (field: TextFormField, value: string) => {
    setSuccess(false);
    setFormState((current) => ({
      ...current,
      [field]: value
    }));
  };

  const updateCheckbox = (field: "isFeatured", value: boolean) => {
    setSuccess(false);
    setFormState((current) => ({
      ...current,
      [field]: value
    }));
  };

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

  const handleTypeChange = (value: ListingType) => {
    setListingType(value);
    setErrors({});
    setGlobalError("");
    setSuccess(false);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuccess(false);
    setErrors({});
    setGlobalError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch(actionPath, {
      method: mode === "edit" ? "PUT" : "POST",
      body: formData
    });

    const payload = await response.json();

    if (!response.ok) {
      const responseErrors = payload?.errors ?? {};
      setErrors(responseErrors);
      if (responseErrors.auth) {
        setGlobalError(String(responseErrors.auth));
      }
      setIsSubmitting(false);
      return;
    }

    if (mode === "create") {
      setListingType("house");
      setFormState(buildFormState());
      formRef.current?.reset();
    }

    setIsSubmitting(false);
    setSuccess(true);
  }

  return (
    <form
      ref={formRef}
      id={mode === "edit" ? "edit-listing-form" : "add-listing-form"}
      data-automation={mode === "edit" ? "edit-listing-form" : "add-listing-form"}
      className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-[0_20px_60px_rgba(2,6,23,0.35)]"
      onSubmit={handleSubmit}
    >
      <div className="rounded-3xl bg-slate-50 p-4 sm:p-5 dark:bg-slate-950/50">
        <label htmlFor="prop-type" className="label-base">
          {t.listingForm.propertyTypeLabel}
        </label>
        <select
          id="prop-type"
          data-automation="type-selector"
          name="type"
          value={listingType}
          onChange={(event) => handleTypeChange(event.target.value as ListingType)}
          required
          className="input-base"
        >
          <option value="house">{t.listingForm.typeHouse}</option>
          <option value="land">{t.listingForm.typeLand}</option>
        </select>
        {renderError("type")}
      </div>

      <div className="rounded-3xl border border-amber-200/70 bg-amber-50/60 p-4 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <label htmlFor="prop-featured" className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t.listingForm.featuredLabel}
            </label>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t.listingForm.featuredDescription}</p>
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
            {t.listingForm.titleLabel}
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
            placeholder={t.listingForm.titlePlaceholder}
          />
          {renderError("title")}
        </div>

        <div>
          <label htmlFor="prop-price" className="label-base">
            {t.listingForm.priceLabel}
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
              placeholder={t.listingForm.pricePlaceholder}
            />
            <select
              id="prop-currency"
              data-automation="currency-select"
              name="currency"
              value={formState.currency}
              onChange={(event) => updateField("currency", event.target.value)}
              className="input-base"
              aria-label={t.listingForm.currencyLabel}
            >
              <option value="TL">{t.listingForm.currencyTL}</option>
              <option value="USD">{t.listingForm.currencyUSD}</option>
              <option value="EUR">{t.listingForm.currencyEUR}</option>
            </select>
          </div>
          {renderError("price")}
          {renderError("currency")}
        </div>

        <div>
          <label htmlFor="prop-location" className="label-base">
            {t.listingForm.locationLabel}
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
            placeholder={t.listingForm.locationPlaceholder}
          />
          {renderError("location")}
        </div>

        <div>
          <label htmlFor="prop-area-sqm" className="label-base">
            {t.listingForm.areaLabel}
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
            placeholder={t.listingForm.areaPlaceholder}
          />
          {renderError("areaSqm")}
        </div>
      </div>

      {isHouse ? (
        <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-950/50">
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-amber-400">{t.listingForm.houseSectionTitle}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.listingForm.houseSectionDescription}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label htmlFor="prop-room-count" className="label-base">
                {t.listingForm.roomCountLabel}
              </label>
              <input
                id="prop-room-count"
                data-automation="room-count-input"
                name="roomCount"
                type="text"
                className="input-base"
                placeholder={t.listingForm.roomCountPlaceholder}
                required
                value={formState.roomCount}
                onChange={(event) => updateField("roomCount", event.target.value)}
              />
              {renderError("roomCount")}
            </div>

            <div>
              <label htmlFor="prop-floor-number" className="label-base">
                {t.listingForm.floorLabel}
              </label>
              <input
                id="prop-floor-number"
                data-automation="floor-input"
                name="floorNumber"
                type="number"
                className="input-base"
                placeholder={t.listingForm.floorPlaceholder}
                required
                value={formState.floorNumber}
                onChange={(event) => updateField("floorNumber", event.target.value)}
              />
              {renderError("floorNumber")}
            </div>

            <div>
              <label htmlFor="prop-heating-type" className="label-base">
                {t.listingForm.heatingLabel}
              </label>
              <input
                id="prop-heating-type"
                data-automation="heating-input"
                name="heatingType"
                type="text"
                className="input-base"
                placeholder={t.listingForm.heatingPlaceholder}
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-amber-400">{t.listingForm.landSectionTitle}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.listingForm.landSectionDescription}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label htmlFor="prop-zoning-status" className="label-base">
                {t.listingForm.zoningLabel}
              </label>
              <input
                id="prop-zoning-status"
                data-automation="zoning-input"
                name="zoningStatus"
                type="text"
                className="input-base"
                placeholder={t.listingForm.zoningPlaceholder}
                required
                value={formState.zoningStatus}
                onChange={(event) => updateField("zoningStatus", event.target.value)}
              />
              {renderError("zoningStatus")}
            </div>

            <div>
              <label htmlFor="prop-island-number" className="label-base">
                {t.listingForm.islandLabel}
              </label>
              <input
                id="prop-island-number"
                data-automation="island-input"
                name="islandNumber"
                type="number"
                className="input-base"
                placeholder={t.listingForm.islandPlaceholder}
                required
                value={formState.islandNumber}
                onChange={(event) => updateField("islandNumber", event.target.value)}
              />
              {renderError("islandNumber")}
            </div>

            <div>
              <label htmlFor="prop-parcel-number" className="label-base">
                {t.listingForm.parcelLabel}
              </label>
              <input
                id="prop-parcel-number"
                data-automation="parcel-input"
                name="parcelNumber"
                type="number"
                className="input-base"
                placeholder={t.listingForm.parcelPlaceholder}
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
          {t.listingForm.descriptionLabel}
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
          placeholder={t.listingForm.descriptionPlaceholder}
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
        {isSubmitting ? t.listingForm.saving : submitLabel}
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
    </form>
  );
}
