"use client";

import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "@/components/auth-provider";
import { LocationPicker } from "@/components/location-picker";
import { Notice } from "@/components/support-ui";
import {
  getCategories,
  type CategorySummary,
  type SupportRequestPayload,
} from "@/lib/api";

export type SupportRequestFormValue = {
  title: string;
  description: string;
  categoryId: string;
  address: string;
  latitude: string;
  longitude: string;
};

const emptyForm: SupportRequestFormValue = {
  title: "",
  description: "",
  categoryId: "",
  address: "",
  latitude: "",
  longitude: "",
};

export function SupportRequestForm({
  initialValue = emptyForm,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialValue?: SupportRequestFormValue;
  submitLabel: string;
  onSubmit: (payload: SupportRequestPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const { getAccessToken } = useAuth();
  const [form, setForm] = useState(initialValue);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const token = await getAccessToken();
        const data = await getCategories(token);

        if (!cancelled) {
          setCategories(data);
          setForm((current) => ({
            ...current,
            categoryId: current.categoryId || data[0]?.id || "",
          }));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [getAccessToken]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (
      !form.latitude.trim() ||
      !form.longitude.trim() ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      setError("Please search for a location or select a point on the map.");
      return;
    }

    setSubmitting(true);

    try {
      const payload: SupportRequestPayload = {
        title: form.title.trim(),
        description: form.description.trim(),
        categoryId: form.categoryId,
        latitude,
        longitude,
      };

      if (form.address.trim()) {
        payload.address = form.address.trim();
      }

      await onSubmit(payload);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <Field label="Request title" className="lg:col-span-2">
          <input
            required
            maxLength={200}
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            placeholder="Example: Need help covering medical expenses"
            className={inputClassName}
          />
        </Field>

        <Field label="Category">
          <select
            required
            disabled={loadingCategories}
            value={form.categoryId}
            onChange={(event) =>
              setForm({ ...form, categoryId: event.target.value })
            }
            className={inputClassName}
          >
            <option value="">
              {loadingCategories ? "Loading categories..." : "Select a category"}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Detailed description" className="lg:col-span-2">
          <textarea
            required
            rows={7}
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            placeholder="Describe the situation, needs, and any details supporters should know..."
            className={`${inputClassName} min-h-40 resize-y py-3`}
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Do not include passwords, bank account details, or unnecessary
            sensitive information.
          </p>
        </Field>

        <div className="lg:col-span-2">
          <LocationPicker
            required
            disabled={submitting}
            label="Support location"
            value={{
              address: form.address,
              latitude: form.latitude,
              longitude: form.longitude,
            }}
            onChange={(location) =>
              setForm((current) => ({ ...current, ...location }))
            }
          />
        </div>
      </div>

      {error ? (
        <div className="mt-5">
          <Notice type="error">{error}</Notice>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || loadingCategories || !categories.length}
          className="h-11 rounded-xl bg-emerald-700 px-6 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to save the request.";
}
