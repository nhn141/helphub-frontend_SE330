"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { SupportRequestCard } from "@/components/support-request-card";
import {
  AssignmentStatusBadge,
  EmptyState,
  LoadingBlock,
  Notice,
  PageHeading,
} from "@/components/support-ui";
import {
  assignSupportLocation,
  getMySupportRequests,
  getMyVolunteerAssignments,
  getSupportLocations,
  getSupportRequests,
  type SupportLocationSummary,
  type SupportRequestStatus,
  type SupportRequestSummary,
  type VolunteerAssignment,
} from "@/lib/api";
import {
  SUPPORT_REQUEST_STATUS_LABELS,
  VOLUNTEER_STATUS_LABELS,
} from "@/lib/support-request-ui";

type ViewMode = "primary" | "secondary";
type StatusFilter = "ALL" | SupportRequestStatus;

const statusFilters: StatusFilter[] = [
  "ALL",
  "PENDING",
  "APPROVED",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
];

export default function SupportRequestsClient() {
  const { profile, getAccessToken } = useAuth();
  const [allRequests, setAllRequests] = useState<SupportRequestSummary[]>([]);
  const [myRequests, setMyRequests] = useState<SupportRequestSummary[]>([]);
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([]);
  const [locations, setLocations] = useState<SupportLocationSummary[]>([]);
  const [selectedLocationByRequest, setSelectedLocationByRequest] = useState<
    Record<string, string>
  >({});
  const [view, setView] = useState<ViewMode>("primary");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    profile.role === "ADMIN" || profile.role === "COLLABORATOR"
      ? "PENDING"
      : "ALL",
  );
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [assigningRequestId, setAssigningRequestId] = useState<string | null>(
    null,
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();

      if (profile.role === "REQUESTER") {
        const [community, mine] = await Promise.all([
          getSupportRequests(token),
          getMySupportRequests(token),
        ]);
        setAllRequests(community);
        setMyRequests(mine);
      } else if (profile.role === "VOLUNTEER") {
        const [community, myAssignments] = await Promise.all([
          getSupportRequests(token),
          getMyVolunteerAssignments(token),
        ]);
        setAllRequests(community);
        setAssignments(myAssignments);
      } else {
        const [requests, supportLocations] = await Promise.all([
          getSupportRequests(token),
          getSupportLocations(token),
        ]);
        setAllRequests(requests);
        setLocations(supportLocations);
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, profile.role]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  const visibleRequests = useMemo(() => {
    let source = allRequests;

    if (profile.role === "REQUESTER" && view === "primary") {
      source = myRequests;
    }

    if (profile.role === "REQUESTER" && view === "secondary") {
      source = allRequests.filter(
        (request) =>
          request.status === "APPROVED" ||
          request.status === "IN_PROGRESS" ||
          request.status === "COMPLETED",
      );
    }

    if (profile.role === "VOLUNTEER") {
      source = allRequests.filter(
        (request) =>
          request.status === "APPROVED" ||
          request.status === "IN_PROGRESS",
      );
    }

    const normalizedQuery = query.trim().toLocaleLowerCase("en");

    return source.filter((request) => {
      const statusMatches =
        statusFilter === "ALL" || request.status === statusFilter;
      const queryMatches =
        !normalizedQuery ||
        request.title.toLocaleLowerCase("en").includes(normalizedQuery) ||
        request.categoryName
          .toLocaleLowerCase("en")
          .includes(normalizedQuery) ||
        request.requesterName
          .toLocaleLowerCase("en")
          .includes(normalizedQuery) ||
        request.address?.toLocaleLowerCase("en").includes(normalizedQuery);

      return statusMatches && Boolean(queryMatches);
    });
  }, [
    allRequests,
    myRequests,
    profile.role,
    query,
    statusFilter,
    view,
  ]);

  const showAssignments =
    profile.role === "VOLUNTEER" && view === "secondary";
  const canAssignLocations =
    profile.role === "ADMIN" || profile.role === "COLLABORATOR";

  async function handleAssignLocation(
    supportRequestId: string,
    supportLocationId: string,
  ) {
    if (!supportLocationId) {
      return;
    }

    setAssigningRequestId(supportRequestId);
    setError(null);
    setSuccess(null);

    try {
      const token = await getAccessToken();
      await assignSupportLocation(token, supportRequestId, supportLocationId);
      setSuccess("Support location assigned successfully.");
      await loadData();
    } catch (assignError) {
      setError(getErrorMessage(assignError));
    } finally {
      setAssigningRequestId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Support requests"
        title={getPageTitle(profile.role)}
        description={getPageDescription(profile.role)}
        action={
          profile.role === "REQUESTER" ? (
            <Link
              href="/support-requests/new"
              className="inline-flex h-11 items-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Create request
            </Link>
          ) : null
        }
      />

      {error ? (
        <Notice type="error">
          {error}{" "}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => void loadData()}
          >
            Try again
          </button>
        </Notice>
      ) : null}
      {success ? <Notice type="success">{success}</Notice> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        {(profile.role === "REQUESTER" || profile.role === "VOLUNTEER") && (
          <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setView("primary")}
              className={tabClassName(view === "primary")}
            >
              {profile.role === "REQUESTER"
                ? "My requests"
                : "Seeking support"}
            </button>
            <button
              type="button"
              onClick={() => setView("secondary")}
              className={tabClassName(view === "secondary")}
            >
              {profile.role === "REQUESTER"
                ? "Community requests"
                : "My assignments"}
            </button>
          </div>
        )}

        {!showAssignments ? (
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <label className="relative block w-full xl:max-w-sm">
              <span className="sr-only">Search requests</span>
              <SearchIcon />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title, category, or address..."
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {statusFilters.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`h-9 shrink-0 rounded-lg border px-3 text-xs font-semibold transition ${
                    statusFilter === status
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
                  }`}
                >
                  {status === "ALL"
                    ? "All"
                    : SUPPORT_REQUEST_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {loading ? (
        <LoadingBlock />
      ) : showAssignments ? (
        assignments.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {assignments.map((assignment) => (
              <article
                key={`${assignment.supportRequestId}-${assignment.volunteerId}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <AssignmentStatusBadge status={assignment.status} />
                  <span className="text-xs text-slate-400">
                    {VOLUNTEER_STATUS_LABELS[assignment.status]}
                  </span>
                </div>
                <Link
                  href={`/support-requests/${assignment.supportRequestId}`}
                  className="mt-4 block text-lg font-bold leading-7 text-slate-950 hover:text-emerald-800"
                >
                  {assignment.supportRequestTitle}
                </Link>
                <p className="mt-2 text-sm text-slate-500">
                  Requester: {assignment.requesterName}
                </p>
                {assignment.rejectionReason ? (
                  <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
                    Reason: {assignment.rejectionReason}
                  </p>
                ) : null}
                <Link
                  href={`/support-requests/${assignment.supportRequestId}`}
                  className="mt-5 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  Open request
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="You have no assignments yet"
            description="Choose an approved request and apply to provide support."
          />
        )
      ) : visibleRequests.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleRequests.map((request) => (
            <SupportRequestCard
              key={request.id}
              request={request}
              footer={
                canAssignLocations &&
                (request.status === "APPROVED" ||
                  request.status === "IN_PROGRESS") ? (
                  <QuickAssignLocation
                    disabled={assigningRequestId === request.id}
                    locations={locations}
                    selectedLocationId={
                      selectedLocationByRequest[request.id] ?? ""
                    }
                    onSelectedLocationChange={(locationId) =>
                      setSelectedLocationByRequest((current) => ({
                        ...current,
                        [request.id]: locationId,
                      }))
                    }
                    onAssign={() =>
                      void handleAssignLocation(
                        request.id,
                        selectedLocationByRequest[request.id] ?? "",
                      )
                    }
                  />
                ) : undefined
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No matching requests found"
          description="Try changing the status filter or search terms."
          actionHref={
            profile.role === "REQUESTER" && view === "primary"
              ? "/support-requests/new"
              : undefined
          }
          actionLabel="Create request"
        />
      )}
    </div>
  );
}

function QuickAssignLocation({
  locations,
  selectedLocationId,
  disabled,
  onSelectedLocationChange,
  onAssign,
}: {
  locations: SupportLocationSummary[];
  selectedLocationId: string;
  disabled: boolean;
  onSelectedLocationChange: (locationId: string) => void;
  onAssign: () => void;
}) {
  if (!locations.length) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
        No active support locations are available.
      </p>
    );
  }

  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <label>
        <span className="mb-1.5 block text-xs font-semibold text-slate-600">
          Assign support location
        </span>
        <select
          value={selectedLocationId}
          onChange={(event) => onSelectedLocationChange(event.target.value)}
          disabled={disabled}
          className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
        >
          <option value="">Select location</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={!selectedLocationId || disabled}
        onClick={onAssign}
        className="mt-2 h-9 w-full rounded-lg bg-slate-950 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {disabled ? "Assigning..." : "Assign location"}
      </button>
    </div>
  );
}

function getPageTitle(role: string): string {
  if (role === "REQUESTER") {
    return "Manage support requests";
  }

  if (role === "VOLUNTEER") {
    return "Find support opportunities";
  }

  return "Coordinate support requests";
}

function getPageDescription(role: string): string {
  if (role === "REQUESTER") {
    return "Track statuses, update needs, and review volunteer applications.";
  }

  if (role === "VOLUNTEER") {
    return "Choose requests that match your abilities and track your applications.";
  }

  return "Review details, assign support locations, and track system-wide progress.";
}

function tabClassName(active: boolean): string {
  return `h-9 rounded-lg px-4 text-sm font-semibold transition ${
    active
      ? "bg-white text-emerald-800 shadow-sm"
      : "text-slate-500 hover:text-slate-800"
  }`;
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </svg>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unable to load support requests.";
}
