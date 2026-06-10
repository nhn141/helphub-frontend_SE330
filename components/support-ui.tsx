import Link from "next/link";
import type { ReactNode } from "react";

import type {
  SupportRequestStatus,
  VolunteerAssignmentStatus,
} from "@/lib/api";
import {
  assignmentStatusClassName,
  statusClassName,
  SUPPORT_REQUEST_STATUS_LABELS,
  VOLUNTEER_STATUS_LABELS,
} from "@/lib/support-request-ui";

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: SupportRequestStatus }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${statusClassName(status)}`}
    >
      {SUPPORT_REQUEST_STATUS_LABELS[status]}
    </span>
  );
}

export function AssignmentStatusBadge({
  status,
}: {
  status: VolunteerAssignmentStatus;
}) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${assignmentStatusClassName(status)}`}
    >
      {VOLUNTEER_STATUS_LABELS[status]}
    </span>
  );
}

export function LoadingBlock({ message = "Loading data..." }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <div className="text-center">
        <div className="mx-auto size-8 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
        <p className="mt-3 text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <HeartIcon />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex h-10 items-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function Notice({
  type,
  children,
}: {
  type: "success" | "error" | "info";
  children: ReactNode;
}) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-rose-200 bg-rose-50 text-rose-900",
    info: "border-sky-200 bg-sky-50 text-sky-900",
  };

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm leading-6 ${styles[type]}`}
    >
      {children}
    </div>
  );
}

function HeartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M12 21s-8-4.7-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.3-8 11-8 11Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
