"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getDictionary } from "@/lib/locale";

type LoginErrors = {
  password?: string;
};

export function AdminLoginForm() {
  const t = getDictionary();
  const router = useRouter();
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password })
    });

    const payload = await response.json();

    if (!response.ok) {
      setErrors(payload?.errors ?? { password: t.errors.passwordInvalid });
      setIsSubmitting(false);
      return;
    }

    router.refresh();
  }

  return (
    <form
      id="admin-login-form"
      data-automation="admin-login-form"
      onSubmit={handleSubmit}
      className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label htmlFor="admin-password" className="label-base">
          {t.adminLogin.passwordLabel}
        </label>
        <input
          id="admin-password"
          data-automation="admin-password-input"
          name="password"
          type="password"
          autoComplete="current-password"
          className="input-base"
          placeholder={t.adminLogin.passwordPlaceholder}
          required
        />
        {errors.password ? (
          <div id="error-password" data-automation="error-password" className="mt-1 text-sm text-red-600">
            {errors.password}
          </div>
        ) : null}
      </div>

      <button
        id="admin-login-button"
        data-automation="admin-login-button"
        type="submit"
        className="button-primary w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? t.adminLogin.checking : t.adminLogin.button}
      </button>
    </form>
  );
}
