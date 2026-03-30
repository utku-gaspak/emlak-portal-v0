"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslation } from "@/context/TranslationContext";

type LoginErrors = {
  username?: string;
  password?: string;
  auth?: string;
};

export function AdminLoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const response = await signIn("credentials", {
      redirect: false,
      username: username.trim(),
      password
    });

    if (!response || response.error) {
      setErrors({
        auth: t.adminLogin.loginFailed
      });
      setIsSubmitting(false);
      return;
    }

    router.replace("/admin/listings");
  }

  return (
    <form
      id="admin-login-form"
      data-automation="admin-login-form"
      onSubmit={handleSubmit}
      className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
    >
      <div>
        <label htmlFor="admin-username" className="label-base">
          {t.adminLogin.usernameLabel}
        </label>
        <input
          id="admin-username"
          data-automation="admin-username-input"
          name="username"
          type="text"
          autoComplete="username"
          className="input-base dark:bg-slate-900"
          placeholder={t.adminLogin.usernamePlaceholder}
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        {errors.username ? (
          <div id="error-username" data-automation="error-username" className="mt-1 text-sm text-red-600">
            {errors.username}
          </div>
        ) : null}
      </div>

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
          className="input-base dark:bg-slate-900"
          placeholder={t.adminLogin.passwordPlaceholder}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {errors.password ? (
          <div id="error-password" data-automation="error-password" className="mt-1 text-sm text-red-600">
            {errors.password}
          </div>
        ) : null}
      </div>

      {errors.auth ? (
        <div id="error-auth" data-automation="error-auth" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {errors.auth}
        </div>
      ) : null}

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
