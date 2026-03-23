"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Check, ChevronDown, Home, Mountain, X } from "lucide-react";
import type { Category } from "@/lib/types";
import { getCategoryIconKey } from "@/lib/category-utils";

type CategoryDropdownProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options: Category[];
  onChange: (nextValue: string) => void;
  dataAutomation: string;
  clearLabel?: string;
  allowClear?: boolean;
  disabled?: boolean;
  className?: string;
};

function CategoryIcon({ category }: { category?: Category | null }) {
  const iconKey = getCategoryIconKey(category);

  if (iconKey === "mountain") {
    return <Mountain className="h-4 w-4" />;
  }

  if (iconKey === "building") {
    return <Building2 className="h-4 w-4" />;
  }

  return <Home className="h-4 w-4" />;
}

export function CategoryDropdown({
  id,
  label,
  placeholder,
  value,
  options,
  onChange,
  dataAutomation,
  clearLabel = "Clear",
  allowClear = false,
  disabled = false,
  className = "input-base"
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedOption = useMemo(() => options.find((option) => option.id === value) ?? null, [options, value]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const triggerText = selectedOption?.name ?? placeholder;

  return (
    <div ref={menuRef} className="relative">
      <label htmlFor={id} className="label-base">
        {label}
      </label>

      <button
        id={id}
        type="button"
        data-automation={dataAutomation}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen((current) => !current)}
        className={`${className} relative w-full overflow-hidden pr-10 text-left whitespace-nowrap ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <span className="flex items-center gap-2">
          {selectedOption ? (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              <CategoryIcon category={selectedOption} />
            </span>
          ) : null}
          <span className="block truncate text-sm leading-6 text-slate-900 dark:text-slate-100">{triggerText}</span>
        </span>
        <ChevronDown
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && !disabled ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_55px_rgba(15,23,42,0.14)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_22px_55px_rgba(2,6,23,0.35)]">
          <div role="listbox" aria-label={label} className="max-h-72 overflow-y-auto p-1">
            {allowClear ? (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <span>{clearLabel}</span>
                <X className="h-4 w-4" />
              </button>
            ) : null}

            {options.length > 0 ? (
              options.map((option) => {
                const isActive = option.id === value;

                return (
                  <button
                    key={option.id}
                    type="button"
                    data-automation={`${dataAutomation}-option-${option.id}`}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      onChange(option.id);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      isActive
                        ? "bg-slate-950 text-white"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200"}`}>
                        <CategoryIcon category={option} />
                      </span>
                      <span>{option.name}</span>
                    </span>
                    {isActive ? <Check className="h-4 w-4" /> : null}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">{placeholder}</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
