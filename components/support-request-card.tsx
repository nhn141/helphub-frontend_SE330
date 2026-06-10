import Link from "next/link";

import { StatusBadge } from "@/components/support-ui";
import type { SupportRequestSummary } from "@/lib/api";
import { formatDateTime } from "@/lib/support-request-ui";

export function SupportRequestCard({
  request,
  footer,
}: {
  request: SupportRequestSummary;
  footer?: React.ReactNode;
}) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
          {request.categoryName}
        </span>
        <StatusBadge status={request.status} />
      </div>

      <Link
        href={`/support-requests/${request.id}`}
        className="mt-4 text-lg font-bold leading-7 text-slate-950 transition group-hover:text-emerald-800"
      >
        {request.title}
      </Link>

      <div className="mt-4 space-y-2 text-sm text-slate-500">
        <p className="flex items-center gap-2">
          <PersonIcon />
          <span className="truncate">{request.requesterName}</span>
        </p>
        <p className="flex items-start gap-2">
          <LocationIcon />
          <span className="line-clamp-2">
            {request.address || "Chưa cung cấp địa chỉ"}
          </span>
        </p>
      </div>

      <div className="mt-auto border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
          <span>{formatDateTime(request.createdAt)}</span>
          <Link
            href={`/support-requests/${request.id}`}
            className="font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Xem chi tiết
          </Link>
        </div>
        {footer ? <div className="mt-3">{footer}</div> : null}
      </div>
    </article>
  );
}

function PersonIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="mt-0.5 size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="8" r="3" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" strokeLinecap="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="mt-0.5 size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
