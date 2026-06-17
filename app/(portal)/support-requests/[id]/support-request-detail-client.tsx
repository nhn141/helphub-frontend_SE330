"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { SupportNeedsSection } from "@/components/support-needs-section";
import {
  LoadingBlock,
  Notice,
  PageHeading,
  StatusBadge,
} from "@/components/support-ui";
import { VolunteerAssignmentsSection } from "@/components/volunteer-assignments-section";
import {
  applyToSupportRequest,
  approveSupportRequest,
  assignSupportLocation,
  cancelVolunteerAssignment,
  completeVolunteerAssignment,
  getMyVolunteerAssignments,
  getSupportLocations,
  getSupportNeedContributions,
  getSupportNeeds,
  getSupportRequest,
  getVolunteerAssignments,
  rejectSupportRequest,
  type SupportLocationSummary,
  type SupportNeed,
  type SupportNeedContribution,
  type SupportRequestDetail,
  type VolunteerAssignment,
} from "@/lib/api";
import {
  formatDateTime,
  ROLE_LABELS,
} from "@/lib/support-request-ui";

export default function SupportRequestDetailClient({
  supportRequestId,
}: {
  supportRequestId: string;
}) {
  const { profile, getAccessToken } = useAuth();
  const [request, setRequest] = useState<SupportRequestDetail | null>(null);
  const [needs, setNeeds] = useState<SupportNeed[]>([]);
  const [contributions, setContributions] = useState<
    Record<string, SupportNeedContribution[]>
  >({});
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([]);
  const [locations, setLocations] = useState<SupportLocationSummary[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);

    try {
      const token = await getAccessToken();
      const [requestData, needsData] = await Promise.all([
        getSupportRequest(token, supportRequestId),
        getSupportNeeds(token, supportRequestId),
      ]);

      const contributionEntries = await Promise.all(
        needsData.map(async (need) => [
          need.id,
          await getSupportNeedContributions(token, need.id),
        ]),
      );

      let assignmentData: VolunteerAssignment[] = [];
      if (
        profile.role === "ADMIN" ||
        profile.role === "COLLABORATOR" ||
        requestData.requesterId === profile.id
      ) {
        assignmentData = await getVolunteerAssignments(
          token,
          supportRequestId,
        );
      } else if (profile.role === "VOLUNTEER") {
        assignmentData = (await getMyVolunteerAssignments(token)).filter(
          (assignment) =>
            assignment.supportRequestId === supportRequestId,
        );
      }

      let locationData: SupportLocationSummary[] = [];
      if (profile.role === "ADMIN" || profile.role === "COLLABORATOR") {
        locationData = await getSupportLocations(token);
      }

      setRequest(requestData);
      setNeeds(needsData);
      setContributions(Object.fromEntries(contributionEntries));
      setAssignments(assignmentData);
      setLocations(locationData);
      setSelectedLocationId(
        requestData.assignedSupportLocationId ?? locationData[0]?.id ?? "",
      );
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, profile.id, profile.role, supportRequestId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  const myAssignment = useMemo(
    () =>
      profile.role === "VOLUNTEER"
        ? assignments.find(
            (assignment) => assignment.volunteerId === profile.id,
          )
        : undefined,
    [assignments, profile.id, profile.role],
  );

  async function runAction(
    actionName: string,
    successMessage: string,
    action: (token: string) => Promise<unknown>,
  ): Promise<boolean> {
    setBusyAction(actionName);
    setError(null);
    setSuccess(null);

    try {
      const token = await getAccessToken();
      await action(token);
      setSuccess(successMessage);
      await loadData();
      return true;
    } catch (actionError) {
      setError(getErrorMessage(actionError));
      return false;
    } finally {
      setBusyAction(null);
    }
  }

  if (loading) {
    return <LoadingBlock message="Loading request details..." />;
  }

  if (!request) {
    return (
      <Notice type="error">
        {error ?? "Support request not found."}
      </Notice>
    );
  }

  const isOwner = request.requesterId === profile.id;
  const isReviewer =
    profile.role === "ADMIN" || profile.role === "COLLABORATOR";
  const canManageNeeds =
    profile.role === "REQUESTER" &&
    isOwner &&
    (request.status === "PENDING" || request.status === "APPROVED");
  const canContribute =
    (request.status === "APPROVED" || request.status === "IN_PROGRESS") &&
    (profile.role === "COLLABORATOR" ||
      (profile.role === "VOLUNTEER" &&
        myAssignment?.status === "ACCEPTED"));
  const canViewAssignments = isReviewer || isOwner;
  const canAssignLocation =
    isReviewer &&
    (request.status === "APPROVED" || request.status === "IN_PROGRESS");

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow={request.categoryName}
        title={request.title}
        description={`Posted by ${request.requesterName} · ${formatDateTime(request.createdAt)}`}
        action={<StatusBadge status={request.status} />}
      />

      {error ? <Notice type="error">{error}</Notice> : null}
      {success ? <Notice type="success">{success}</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.7fr)]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">
              Request details
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {request.description}
            </p>

            {request.rejectionReason ? (
              <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                  Rejection reason
                </p>
                <p className="mt-2 text-sm text-rose-900">
                  {request.rejectionReason}
                </p>
              </div>
            ) : null}
          </section>

          <SupportNeedsSection
            supportRequestId={supportRequestId}
            needs={needs}
            contributions={contributions}
            canManage={canManageNeeds}
            canContribute={canContribute}
            onChanged={loadData}
          />

          {canViewAssignments ? (
            <VolunteerAssignmentsSection
              supportRequestId={supportRequestId}
              assignments={assignments}
              canReview={isReviewer || isOwner}
              onChanged={loadData}
            />
          ) : null}
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-950">Coordination details</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <InfoRow label="Requester" value={request.requesterName} />
              <InfoRow label="Your role" value={ROLE_LABELS[profile.role]} />
              <InfoRow
                label="Address"
                value={request.address || "Not provided"}
              />
              <InfoRow
                label="Support location"
                value={request.assignedSupportLocationName || "Not assigned"}
              />
              <InfoRow
                label="Last updated"
                value={formatDateTime(request.updatedAt)}
              />
            </dl>

            {request.latitude !== null && request.longitude !== null ? (
              <a
                href={`https://www.google.com/maps?q=${request.latitude},${request.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Open location in maps
              </a>
            ) : null}
          </section>

          {isOwner && request.status === "PENDING" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-950">Manage request</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                You can edit request details while it is pending review.
              </p>
              <Link
                href={`/support-requests/${supportRequestId}/edit`}
                className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                Edit request
              </Link>
            </section>
          ) : null}

          {isReviewer ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-950">Review request</h2>

              {request.status === "PENDING" ? (
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    disabled={busyAction !== null}
                    onClick={() =>
                      void runAction(
                        "approve",
                        "The request has been approved.",
                        (token) =>
                          approveSupportRequest(token, supportRequestId),
                      )
                    }
                    className="h-10 w-full rounded-xl bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-800 disabled:bg-slate-300"
                  >
                    {busyAction === "approve"
                      ? "Approving..."
                      : "Approve request"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(true)}
                    className="h-10 w-full rounded-xl border border-rose-200 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    Reject request
                  </button>
                </div>
              ) : null}

              {showRejectForm && request.status === "PENDING" ? (
                <div className="mt-4 rounded-xl bg-rose-50 p-4">
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-rose-900">
                      Rejection reason
                    </span>
                    <textarea
                      rows={4}
                      maxLength={200}
                      value={rejectionReason}
                      onChange={(event) =>
                        setRejectionReason(event.target.value)
                      }
                      className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                    />
                  </label>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(false)}
                      className="h-8 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!rejectionReason.trim() || busyAction !== null}
                      onClick={async () => {
                        const succeeded = await runAction(
                          "reject",
                          "The request has been rejected.",
                          (token) =>
                            rejectSupportRequest(
                              token,
                              supportRequestId,
                              rejectionReason,
                            ),
                        );

                        if (succeeded) {
                          setShowRejectForm(false);
                          setRejectionReason("");
                        }
                      }}
                      className="h-8 rounded-lg bg-rose-700 px-3 text-xs font-semibold text-white disabled:bg-slate-300"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              ) : null}

              {canAssignLocation ? (
                <div className="mt-4">
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Support location
                    </span>
                    <select
                      value={selectedLocationId}
                      onChange={(event) =>
                        setSelectedLocationId(event.target.value)
                      }
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600"
                    >
                      <option value="">Select a support location</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={
                      !selectedLocationId ||
                      selectedLocationId ===
                        (request.assignedSupportLocationId ?? "") ||
                      busyAction !== null
                    }
                    onClick={() =>
                      void runAction(
                        "location",
                        "The support location has been assigned.",
                        (token) =>
                          assignSupportLocation(
                            token,
                            supportRequestId,
                            selectedLocationId,
                          ),
                      )
                    }
                    className="mt-3 h-10 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-300"
                  >
                    {busyAction === "location"
                      ? "Updating..."
                      : request.assignedSupportLocationId
                        ? "Update support location"
                        : "Assign support location"}
                  </button>
                  {!locations.length ? (
                    <p className="mt-2 text-xs leading-5 text-amber-700">
                      There are no active support locations in the system.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {request.status !== "PENDING" &&
              !canAssignLocation ? (
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  This request is closed and can no longer be reviewed.
                </p>
              ) : null}
            </section>
          ) : null}

          {profile.role === "VOLUNTEER" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-950">
                Join this request
              </h2>
              {myAssignment ? (
                <>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Application status:{" "}
                    <strong className="text-slate-800">
                      {getAssignmentLabel(myAssignment.status)}
                    </strong>
                  </p>
                  {myAssignment.rejectionReason ? (
                    <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
                      {myAssignment.rejectionReason}
                    </p>
                  ) : null}
                  {(myAssignment.status === "PENDING" ||
                    myAssignment.status === "ACCEPTED") && (
                    <button
                      type="button"
                      disabled={busyAction !== null}
                      onClick={() =>
                        void runAction(
                          "cancel",
                          "Your application has been cancelled.",
                          (token) =>
                            cancelVolunteerAssignment(
                              token,
                              supportRequestId,
                            ),
                        )
                      }
                      className="mt-4 h-10 w-full rounded-xl border border-rose-200 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      Cancel application
                    </button>
                  )}
                  {myAssignment.status === "ACCEPTED" ? (
                    <button
                      type="button"
                      disabled={busyAction !== null}
                      onClick={() =>
                        void runAction(
                          "complete",
                          "Your assignment has been marked as completed.",
                          (token) =>
                            completeVolunteerAssignment(
                              token,
                              supportRequestId,
                            ),
                        )
                      }
                      className="mt-3 h-10 w-full rounded-xl bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-800 disabled:bg-slate-300"
                    >
                      Complete assignment
                    </button>
                  ) : null}
                </>
              ) : request.status === "APPROVED" ||
                request.status === "IN_PROGRESS" ? (
                <>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Apply to participate and wait for the requester to review
                    your application.
                  </p>
                  <button
                    type="button"
                    disabled={busyAction !== null}
                    onClick={() =>
                      void runAction(
                        "apply",
                        "Your volunteer application has been submitted.",
                        (token) =>
                          applyToSupportRequest(token, supportRequestId),
                      )
                    }
                    className="mt-4 h-10 w-full rounded-xl bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-800 disabled:bg-slate-300"
                  >
                    {busyAction === "apply"
                      ? "Submitting..."
                      : "Apply to support"}
                  </button>
                </>
              ) : (
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Volunteer applications are only available for approved or
                  in-progress requests.
                </p>
              )}
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 leading-6 text-slate-700">{value}</dd>
    </div>
  );
}

function getAssignmentLabel(status: VolunteerAssignment["status"]): string {
  const labels: Record<VolunteerAssignment["status"], string> = {
    PENDING: "Pending approval",
    ACCEPTED: "Accepted",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
    COMPLETED: "Completed",
  };

  return labels[status];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unable to process the support request.";
}
